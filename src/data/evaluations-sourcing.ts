import { deriveOutcome, type Candidate, type GateResult } from "@/schema";
import { EVALUATOR_VERSION, demoNowIso } from "@/lib/constants";
import type { CandidateFacets } from "./seed";
import type { Position } from "./positions";

const NAME_POOL = [
  "Aditya Verma",
  "Maria Santos",
  "Yusuf Rahman",
  "Chloe Dubois",
  "Karim Nassar",
  "Elena Petrova",
  "Tunde Adeyemi",
  "Sofia Rossi",
];

const SOURCES = ["LinkedIn", "LinkedIn", "LinkedIn", "Indent", "Referral", "Bayt"];

// Score spread: two strong, two solid, one borderline, one weak.
const SCORE_SPREAD = [4.6, 4.2, 3.8, 3.4, 3.0, 2.5];

function headlineFor(score: number, role: string, top: string[]): string {
  const a = top[0] ?? "core skills";
  const b = top[1] ?? "the essentials";
  if (score >= 4.4) return `Strong ${role} match; deep on ${a} and ${b}.`;
  if (score >= 4.0) return `Solid all-round match with good ${a} coverage.`;
  if (score >= 3.5) return `Capable candidate; ${a} strong, some gaps elsewhere.`;
  if (score >= 3.0) return `Adjacent background; core ${a} depth unproven.`;
  return `Limited ${role} experience against the essential criteria.`;
}

function reasoningFor(score: number, top: string[], gap: string): string {
  const a = top[0] ?? "the essential skills";
  if (score >= 4.0)
    return `Covers the essential criteria well, with clear evidence of ${a} and related experience. A comfortable pass at pre-screen; ${gap.toLowerCase()} is the only real watch-item.`;
  if (score >= 3.0)
    return `Shows transferable strengths but does not fully evidence ${a} at the depth the role needs. The score lands on the Borderline band, routing to a human decision.`;
  return `The résumé does not demonstrate the essential ${a} or comparable hands-on experience. Against the weighted criteria this is a clear miss.`;
}

/** Dummy "sourced from LinkedIn" prospects, scored at Gate 1 against the JD. */
export function generateSourcedCandidates(position: Position): {
  candidates: Candidate[];
  results: GateResult[];
  facets: Record<string, CandidateFacets>;
} {
  const job = position.jd.jobRole;
  const g1 = position.gateDefinitions.find((d) => d.order === 1)!;
  const skills = job.skills.map((s) => s.skill);
  const top = skills.slice(0, 4);
  const gapPool = skills.slice(4);

  const candidates: Candidate[] = [];
  const results: GateResult[] = [];
  const facets: Record<string, CandidateFacets> = {};

  SCORE_SPREAD.forEach((score, i) => {
    const name = NAME_POOL[i] ?? `Candidate ${i + 1}`;
    const id = `src_${position.id}_${i}`;
    const matchCount = score >= 4.4 ? 3 : score >= 3.5 ? 2 : 1;
    const matchingSkills = top.slice(0, matchCount);
    const gap = gapPool[i % Math.max(1, gapPool.length)] ?? top[top.length - 1] ?? "sector experience";

    candidates.push({
      id,
      jdId: position.id,
      name,
      headline: `${job.role} · ${job.company.name.split(" ")[0]} sector`,
      location: position.location,
      avatarUrl: null,
      source: SOURCES[i % SOURCES.length] ?? "LinkedIn",
      resumeText: `${job.role} candidate with experience across ${top.slice(0, 2).join(", ")}. Sourced profile matched against the role's criteria.`,
      stage: "prospect",
      status: score >= 3 && score < 4 ? "pending_review" : "active",
      currentGate: 1,
      createdAt: demoNowIso(),
    });

    facets[id] = {
      matchingSkills,
      gap: `${gap} not evidenced`,
    };

    results.push({
      id: `res_${id}_g1`,
      candidateId: id,
      gateId: g1.id,
      gateOrder: 1,
      score,
      scoreUnit: "rubric_1_5",
      aiOutcome: deriveOutcome(score, g1),
      headline: headlineFor(score, job.role, top),
      reasoning: reasoningFor(score, top, `${gap} not evidenced`),
      rawInput: `…profile summary matched against ${top.slice(0, 2).join(" and ")} and related criteria…`,
      evaluatorVersion: EVALUATOR_VERSION,
      evaluatedAt: demoNowIso(),
      jdId: position.id,
    });
  });

  return { candidates, results, facets };
}
