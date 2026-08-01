import {
  deriveOutcome,
  effectiveOutcome,
  type Candidate,
  type CommsDraft,
  type CommsTrigger,
  type CompositeSummary,
  type GateDefinition,
  type GateResult,
  type JobRole,
  type TerminalState,
} from "@/schema";
import { EVALUATOR_VERSION, RECRUITER_NAME, demoNowIso } from "@/lib/constants";
import { candidateResults } from "@/lib/pipeline";
import { formatScore } from "@/lib/format";

// Deterministic [0,1) hash so a candidate's synthesized results are stable.
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 2 ** 32;
}

const INTERVIEW_LINES = [
  "I map the key risks first, then work through them methodically.",
  "I document decisions as I go and escalate early when something is unclear.",
  "I set clear targets for the week and review progress against them.",
  "I focus on getting the fundamentals right before optimising anything.",
];

const TEST_PLATFORMS = ["TestGorilla", "Mercer Mettl", "SHL"];

/** Deterministic pass-biased interview score (4.0–4.5) for a candidate + gate. */
export function interviewScore(candidateId: string, order: number): number {
  const r = hash01(`${candidateId}|g${order}`);
  return Number((4.0 + Math.floor(r * 6) / 10).toFixed(1));
}

/** Build a test-import gate result from an imported percentage. */
export function buildTestResult(candidate: Candidate, def: GateDefinition, pct: number): GateResult {
  const platform = TEST_PLATFORMS[Math.floor(hash01(candidate.id) * TEST_PLATFORMS.length)] ?? "TestGorilla";
  const clears = pct >= def.passThreshold;
  return {
    id: `res_${candidate.id}_g${def.order}`,
    candidateId: candidate.id,
    gateId: def.id,
    gateOrder: def.order,
    jdId: def.jdId,
    evaluatedAt: demoNowIso(),
    score: pct,
    scoreUnit: "percentage",
    aiOutcome: deriveOutcome(pct, def),
    headline: `${def.label}: ${pct}%, ${clears ? "clears the pass mark" : "below the pass mark"}.`,
    reasoning: clears
      ? "Imported from the assessment platform. Sub-scores are consistent and clear the pass threshold for this gate."
      : "Imported from the assessment platform. The score falls below the pass threshold, a fail unless the recruiter overrides.",
    rawInput: `Imported from ${platform}: ${pct}%.`,
    evaluatorVersion: "import_v2.0",
  };
}

/** Build an interview gate result from a transcript + a decided score. */
export function buildInterviewResult(
  candidate: Candidate,
  def: GateDefinition,
  score: number,
  transcript: string,
): GateResult {
  const borderline = score < def.passThreshold;
  const trimmed = transcript.trim();
  const snippet = trimmed
    ? trimmed.replace(/\s+/g, " ").slice(0, 200)
    : (INTERVIEW_LINES[Math.floor(hash01(candidate.id) * INTERVIEW_LINES.length)] ?? INTERVIEW_LINES[0]!);
  return {
    id: `res_${candidate.id}_g${def.order}`,
    candidateId: candidate.id,
    gateId: def.id,
    gateOrder: def.order,
    jdId: def.jdId,
    evaluatedAt: demoNowIso(),
    score,
    scoreUnit: "rubric_1_5",
    aiOutcome: deriveOutcome(score, def),
    headline: borderline
      ? `${def.label}: competent but uneven, routed to review.`
      : `${def.label}: strong, well-judged responses.`,
    reasoning: borderline
      ? "Evaluated against the role and the candidate's full prior gate history. The transcript shows competence but uneven situational judgement, leaving the score in the Borderline band and a human decision required."
      : "Evaluated against the role and the candidate's full prior gate history. The transcript shows accurate, well-structured answers and sound judgement. A clear pass at this gate.",
    rawInput: `Interview transcript: '${snippet}${trimmed.length > 200 ? "…" : ""}'`,
    evaluatorVersion: EVALUATOR_VERSION,
  };
}

// ---------------------------------------------------------------------------
// CommsDraft templates (LLM-draft → recruiter approve → simulated send, H1).
// ---------------------------------------------------------------------------
const SIGN_OFF = `Warm regards,\n${RECRUITER_NAME}\nTalent Acquisition · Contra6 Recruit`;

export function draftComms(candidate: Candidate, trigger: CommsTrigger, jd: JobRole): CommsDraft {
  const first = candidate.name.split(/\s+/)[0] ?? candidate.name;
  const role = jd.role;
  const company = jd.company.name;
  let subject = "";
  let body = "";

  if (trigger === "outreach") {
    subject = `${role} opportunity at ${company}`;
    body = `Hi ${first},\n\nI came across your background and think you could be a strong fit for a ${role} role we're hiring for at ${company} in Dubai. The role centres on UAE HR operations: WPS payroll, visa and labour-card processing, and HRIS.\n\nWould you be open to a short conversation this week? I'd be glad to share the full job description.\n\n${SIGN_OFF}`;
  } else if (trigger === "offer") {
    subject = `Conditional Offer: ${role}, ${company}`;
    body = `Dear ${first},\n\nCongratulations! Following your interviews across our recruitment gates, we are delighted to extend a conditional offer for the ${role} role at ${company}.\n\nThis offer is conditional on standard pre-employment checks and document verification. A full breakdown of compensation, benefits, and start date will follow in your formal contract.\n\nWe would be thrilled to have you join the team.\n\n${SIGN_OFF}`;
  } else {
    subject = `Update on your application: ${role}, ${company}`;
    body = `Dear ${first},\n\nThank you for taking the time to interview for the ${role} role at ${company}, and for your interest in the position.\n\nAfter careful consideration, we have decided not to move forward on this occasion. This was a competitive process and the decision was not an easy one. We would encourage you to apply for future roles that match your experience.\n\nWe wish you every success in your search.\n\n${SIGN_OFF}`;
  }

  return {
    id: `comms_${candidate.id}_${trigger}`,
    candidateId: candidate.id,
    trigger,
    status: "draft",
    subject,
    body,
    draftedAt: demoNowIso(),
    approvedAt: null,
    sentAt: null,
  };
}

// ---------------------------------------------------------------------------
// Composite Summary — generated only at a terminal state (F1).
// ---------------------------------------------------------------------------
export function generateCompositeSummary(
  candidate: Candidate,
  allResults: GateResult[],
  terminalState: TerminalState,
): CompositeSummary {
  const results = candidateResults(allResults, candidate.id);
  const cleared = results.filter((r) => effectiveOutcome(r) === "pass").length;
  const overrides = results.filter((r) => r.humanDecision?.kind === "override");
  const resolves = results.filter((r) => r.humanDecision?.kind === "resolve");
  const first = candidate.name.split(/\s+/)[0] ?? candidate.name;

  const parts: string[] = [];
  parts.push(
    `${candidate.name} reached a ${terminalState === "hired" ? "successful hire" : "rejection"} after ${results.length} gate evaluation${results.length === 1 ? "" : "s"}, clearing ${cleared} of them.`,
  );
  const g1 = results.find((r) => r.gateOrder === 1);
  if (g1) {
    parts.push(
      `${first} entered with a Gate 1 match of ${formatScore(g1.score, g1.scoreUnit)} — "${g1.headline}"`,
    );
  }
  if (overrides.length > 0) {
    const o = overrides[0]!;
    parts.push(
      `At Gate ${o.gateOrder} the recruiter overrode the AI ${o.aiOutcome} to ${o.humanDecision?.outcome}, reasoning: "${o.humanDecision?.reason ?? ""}"`,
    );
  }
  if (resolves.length > 0) {
    parts.push(`${resolves.length} Borderline outcome${resolves.length === 1 ? " was" : "s were"} resolved by a human decision along the way.`);
  }
  parts.push(
    terminalState === "hired"
      ? "The full arc — AI reasoning and every human divergence — is preserved above as an immutable audit trail."
      : "The gap between the candidate's background and the role's bar was the deciding factor; the complete reasoning is preserved above.",
  );

  return {
    candidateId: candidate.id,
    terminalState,
    summary: parts.join(" "),
    generatedAt: demoNowIso(),
  };
}
