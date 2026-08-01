import {
  JobRoleSchema,
  deriveOutcome,
  type CommsDraft,
  type CompositeSummary,
  type Candidate,
  type GateDefinition,
  type GateResult,
  type HumanDecision,
  type StructuredJD,
} from "@/schema";
import { DEMO_NOW, EVALUATOR_VERSION, JD_ID, RECRUITER_NAME } from "@/lib/constants";
import jdJson from "../../hr_assistant_prime_ac.json";

// The extracted JD validated against the mirror of JobRoleSchema.py (source of truth).
const jobRole = JobRoleSchema.parse(jdJson);

// ---------------------------------------------------------------------------
// Structured JD — starts un-frozen so the JD Setup screen can tell the Part 1
// story (tune once → Freeze & Score). Frozen live by the recruiter (ADR 0005).
// ---------------------------------------------------------------------------
export const structuredJD: StructuredJD = {
  id: JD_ID,
  jobRole,
  frozen: false,
  fieldSources: {},
  createdAt: iso(21),
  frozenAt: null,
};

// ---------------------------------------------------------------------------
// The 6 gates for this JD (CONTEXT: GateDefinition; ADR 0002 native units).
// ---------------------------------------------------------------------------
export const gateDefinitions: GateDefinition[] = [
  {
    id: "gate_1",
    jdId: JD_ID,
    order: 1,
    type: "resume_match",
    label: "Pre-screen",
    scoreUnit: "rubric_1_5",
    passThreshold: 4,
    borderlineFloor: 3,
    promptContext:
      "Score the résumé against the frozen JD rubric. Essential skills (UAE Labour Law, WPS, visa & labour-card processing, HRIS, payroll) weigh most, then important, then valuable.",
  },
  {
    id: "gate_2",
    jdId: JD_ID,
    order: 2,
    type: "test_import",
    label: "Aptitude & Logic Test",
    scoreUnit: "percentage",
    passThreshold: 80,
    borderlineFloor: null,
    promptContext: "Imported cognitive aptitude assessment. ≥80% clears the gate.",
  },
  {
    id: "gate_3",
    jdId: JD_ID,
    order: 3,
    type: "interview_eval",
    label: "HR Interview",
    scoreUnit: "rubric_1_5",
    passThreshold: 4,
    borderlineFloor: 3,
    promptContext:
      "First-line HR interview. Assess UAE HR operations knowledge (WPS, MOHRE, records) and employee-relations judgement.",
  },
  {
    id: "gate_4",
    jdId: JD_ID,
    order: 4,
    type: "test_import",
    label: "Functional HR Test",
    scoreUnit: "percentage",
    passThreshold: 80,
    borderlineFloor: null,
    promptContext:
      "Imported role-specific functional test (payroll, compliance, and records scenarios). ≥80% clears the gate.",
  },
  {
    id: "gate_5",
    jdId: JD_ID,
    order: 5,
    type: "interview_eval",
    label: "Dept-Manager Interview",
    scoreUnit: "rubric_1_5",
    passThreshold: 4,
    borderlineFloor: 3,
    promptContext: "Hiring-manager interview. Assess operational fit, ownership, and reliability.",
  },
  {
    id: "gate_6",
    jdId: JD_ID,
    order: 6,
    type: "interview_eval",
    label: "GM Interview",
    scoreUnit: "rubric_1_5",
    passThreshold: 4,
    borderlineFloor: 3,
    promptContext: "Final GM interview. Assess compliance-first mindset and cultural alignment.",
  },
];

const defByOrder = new Map(gateDefinitions.map((g) => [g.order, g]));

// ---------------------------------------------------------------------------
// Shortlist / swipe presentation facets (top matching skills + top gap). Not
// part of the GateResult schema — demo UI metadata for the Gate 1 view.
// ---------------------------------------------------------------------------
export interface CandidateFacets {
  matchingSkills: string[];
  gap: string;
}
export const candidateFacets: Record<string, CandidateFacets> = {};

// ---------------------------------------------------------------------------
// Timestamp + result factories
// ---------------------------------------------------------------------------
function iso(daysAgo: number, hour = 10): string {
  const d = new Date(DEMO_NOW);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

function rubricResult(a: {
  candidateId: string;
  order: number;
  score: number;
  headline: string;
  reasoning: string;
  rawInput: string;
  daysAgo: number;
  human?: HumanDecision;
}): GateResult {
  const def = defByOrder.get(a.order)!;
  return {
    id: `res_${a.candidateId}_g${a.order}`,
    candidateId: a.candidateId,
    gateId: def.id,
    gateOrder: a.order,
    score: a.score,
    scoreUnit: "rubric_1_5",
    aiOutcome: deriveOutcome(a.score, def),
    headline: a.headline,
    reasoning: a.reasoning,
    rawInput: a.rawInput,
    evaluatorVersion: EVALUATOR_VERSION,
    evaluatedAt: iso(a.daysAgo),
    jdId: JD_ID,
    humanDecision: a.human,
  };
}

function testResult(a: {
  candidateId: string;
  order: number;
  pct: number;
  headline: string;
  reasoning: string;
  rawInput: string;
  daysAgo: number;
}): GateResult {
  const def = defByOrder.get(a.order)!;
  return {
    id: `res_${a.candidateId}_g${a.order}`,
    candidateId: a.candidateId,
    gateId: def.id,
    gateOrder: a.order,
    score: a.pct,
    scoreUnit: "percentage",
    aiOutcome: deriveOutcome(a.pct, def),
    headline: a.headline,
    reasoning: a.reasoning,
    rawInput: a.rawInput,
    evaluatorVersion: "import_v2.0",
    evaluatedAt: iso(a.daysAgo),
    jdId: JD_ID,
  };
}

function decision(
  kind: "resolve" | "override",
  outcome: "pass" | "fail",
  daysAgo: number,
  reason?: string,
): HumanDecision {
  return { kind, outcome, reason, actor: RECRUITER_NAME, decidedAt: iso(daysAgo) };
}

// ---------------------------------------------------------------------------
// Candidates + their gate arcs
// ---------------------------------------------------------------------------
const candidates: Candidate[] = [];
const gateResults: GateResult[] = [];

function add(candidate: Candidate, facets: CandidateFacets, results: GateResult[]) {
  candidates.push(candidate);
  candidateFacets[candidate.id] = facets;
  gateResults.push(...results);
}

function prospect(
  p: Omit<Candidate, "jdId" | "stage" | "createdAt" | "currentGate"> & { createdDaysAgo: number },
): Candidate {
  const { createdDaysAgo, ...rest } = p;
  return { ...rest, jdId: JD_ID, stage: "prospect", currentGate: 1, createdAt: iso(createdDaysAgo) };
}

function applicant(
  p: Omit<Candidate, "jdId" | "stage" | "createdAt"> & { createdDaysAgo: number },
): Candidate {
  const { createdDaysAgo, ...rest } = p;
  return { ...rest, jdId: JD_ID, stage: "applicant", createdAt: iso(createdDaysAgo) };
}

// ---- Part 1: fresh prospects on the Gate 1 shortlist / swipe deck ----------

add(
  prospect({
    id: "cand_priya_nair",
    name: "Priya Nair",
    headline: "HR Administrator · MEP Contracting",
    location: "Dubai, UAE",
    source: "LinkedIn",
    status: "active",
    createdDaysAgo: 2,
    resumeText:
      "HR Administrator with 3 years supporting a 400-strong MEP contracting workforce in Dubai. Owned end-to-end visa and labour-card processing via Tasheel and MOHRE, monthly WPS payroll submissions, and Bayzat HRIS records. Coordinated onboarding, Emirates ID renewals, and end-of-service settlements under UAE Labour Law.",
  }),
  {
    matchingSkills: ["UAE Labour Law knowledge", "WPS (Wage Protection System)", "Bayzat HRIS"],
    gap: "No blue-collar labour-camp management called out",
  },
  [
    rubricResult({
      candidateId: "cand_priya_nair",
      order: 1,
      score: 4.6,
      daysAgo: 2,
      headline: "Strong UAE HR admin match; deep WPS, visa, and HRIS coverage.",
      reasoning:
        "Maps directly onto the essential criteria: hands-on WPS payroll, Tasheel/MOHRE visa processing, and Bayzat HRIS across a comparable MEP contracting workforce. The 3-year experience band sits squarely in the 1–4 year target. Minor gap: no explicit labour-camp / blue-collar management surfaced.",
      rawInput:
        "…owned monthly WPS submissions and labour-card renewals via Tasheel for 400+ MEP staff; maintained Bayzat records end to end…",
    }),
  ],
);

add(
  prospect({
    id: "cand_lina_haddad",
    name: "Lina Haddad",
    headline: "HR Coordinator · Facilities Management",
    location: "Dubai, UAE",
    source: "LinkedIn",
    status: "active",
    createdDaysAgo: 2,
    resumeText:
      "Bilingual (Arabic/English) HR Coordinator with 2 years in a Dubai facilities-management group. Handled MOHRE contract registration, GDRFA visa applications, attendance and leave tracking, and first-line employee relations for a mixed office and field workforce.",
  }),
  {
    matchingSkills: ["MOHRE contract registration", "Visa and labour-card processes", "Arabic"],
    gap: "Payroll / WPS ownership was shared, not owned",
  },
  [
    rubricResult({
      candidateId: "cand_lina_haddad",
      order: 1,
      score: 4.4,
      daysAgo: 2,
      headline: "Bilingual coordinator with strong compliance and visa coverage.",
      reasoning:
        "Solid on essential compliance work — MOHRE registration and GDRFA visa applications — plus conversational Arabic, a valuable asset for the mixed workforce. Employee-relations exposure is a plus. Payroll/WPS was a shared responsibility rather than fully owned, the main watch-item.",
      rawInput:
        "…registered MOHRE contracts and filed GDRFA visa applications; tracked attendance and leave for office and field staff…",
    }),
  ],
);

add(
  prospect({
    id: "cand_grace_mendoza",
    name: "Grace Mendoza",
    headline: "HR Coordinator · Trading Group",
    location: "Dubai, UAE",
    source: "Agency",
    status: "active",
    createdDaysAgo: 3,
    resumeText:
      "HR Coordinator with 4 years in a Dubai trading company. Focused on recruitment coordination, interview scheduling, agency liaison, and onboarding logistics on ZenHR. Supported payroll data preparation and leave administration.",
  }),
  {
    matchingSkills: ["Recruitment coordination", "Onboarding/offboarding", "ZenHR"],
    gap: "Limited direct WPS submission ownership",
  },
  [
    rubricResult({
      candidateId: "cand_grace_mendoza",
      order: 1,
      score: 4.1,
      daysAgo: 3,
      headline: "Strong recruitment-coordination and onboarding profile.",
      reasoning:
        "Directly covers the important cluster — recruitment coordination, interview scheduling, agency liaison — and runs ZenHR for onboarding. Payroll was preparation-only, so WPS ownership is unproven, keeping the essential-skill coverage just short of top marks. Overall a clear pass.",
      rawInput:
        "…coordinated recruitment across open roles, scheduled interviews, and ran onboarding on ZenHR; prepared payroll data…",
    }),
  ],
);

add(
  prospect({
    id: "cand_sunil_perera",
    name: "Sunil Perera",
    headline: "Administrative Officer · Building Materials",
    location: "Sharjah, UAE",
    source: "LinkedIn",
    status: "active",
    createdDaysAgo: 3,
    resumeText:
      "Administrative Officer with 2 years' mixed office administration and HR support at a Sharjah building-materials supplier. Maintained employee files, coordinated medical and Emirates ID processing, and assisted payroll data entry in Excel.",
  }),
  {
    matchingSkills: ["Records management and discipline", "Microsoft Excel", "Onboarding/offboarding"],
    gap: "No HRIS platform experience; WPS exposure light",
  },
  [
    rubricResult({
      candidateId: "cand_sunil_perera",
      order: 1,
      score: 3.7,
      daysAgo: 3,
      headline: "Capable admin support; HR-systems depth is light.",
      reasoning:
        "Reliable on records, Emirates ID coordination, and Excel, and within the target experience band. However there is no Bayzat/ZenHR HRIS exposure and WPS involvement was assistive only. Lands a pass but below the strong tier on essential coverage.",
      rawInput:
        "…maintained employee files and coordinated Emirates ID and medical processing; assisted payroll entry in Excel…",
    }),
  ],
);

add(
  prospect({
    id: "cand_mohammed_alfarsi",
    name: "Mohammed Al-Farsi",
    headline: "Office Administrator · Logistics",
    location: "Dubai, UAE",
    source: "LinkedIn",
    status: "pending_review",
    createdDaysAgo: 4,
    resumeText:
      "Office Administrator with 3 years in a Dubai logistics firm, now targeting an HR path. Handled document control, government-portal submissions, and general administration, with some exposure to visa renewals and attendance records.",
  }),
  {
    matchingSkills: ["PRO / government-portal experience", "Attendance, overtime, and leave tracking"],
    gap: "HR-specific WPS, HRIS, and labour-law depth not demonstrated",
  },
  [
    rubricResult({
      candidateId: "cand_mohammed_alfarsi",
      order: 1,
      score: 3.0,
      daysAgo: 4,
      headline: "Adjacent admin background; core HR depth unproven.",
      reasoning:
        "Transferable strengths in government-portal submissions and attendance tracking, but the résumé does not evidence the essential HR operations — WPS payroll, HRIS ownership, or UAE Labour Law application. The score lands on the Borderline band, routing to a human decision rather than an automatic pass or reject.",
      rawInput:
        "…handled document control and government-portal submissions; some exposure to visa renewals and attendance…",
    }),
  ],
);

add(
  prospect({
    id: "cand_rahul_sharma",
    name: "Rahul Sharma",
    headline: "IT Support Technician · Career-changer",
    location: "Dubai, UAE",
    source: "LinkedIn",
    status: "active",
    createdDaysAgo: 4,
    resumeText:
      "IT Support Technician with 4 years in Dubai, recently completing a short HR administration course. Limited hands-on HR experience beyond assisting staff onboarding IT setup and maintaining asset records.",
  }),
  {
    matchingSkills: ["MS Office", "Onboarding/offboarding"],
    gap: "No UAE HR operations, WPS, visa, or HRIS experience",
  },
  [
    rubricResult({
      candidateId: "cand_rahul_sharma",
      order: 1,
      score: 2.3,
      daysAgo: 4,
      headline: "Career-changer; lacks core UAE HR operations experience.",
      reasoning:
        "A recent HR course does not offset the absence of hands-on UAE HR work: no WPS, visa/labour-card, HRIS, or labour-law experience appears in the résumé. Against the essential-weighted criteria this is a clear miss. Score falls below the Borderline floor — an AI Fail.",
      rawInput:
        "…IT support background; assisted onboarding IT setup and asset records; completed a short HR admin course…",
    }),
  ],
);

// ---- Part 2: applicants distributed across the pipeline ---------------------

// Gate 2 — active, test imported and passed
add(
  applicant({
    id: "cand_fatima_zahra",
    name: "Fatima Zahra",
    headline: "HR Assistant · MEP Contractor",
    location: "Dubai, UAE",
    source: "LinkedIn",
    status: "active",
    currentGate: 2,
    createdDaysAgo: 12,
    resumeText:
      "HR Assistant with 3 years at a Dubai MEP contractor. Owned WPS payroll runs, MOHRE contract registration, and Bayzat HRIS updates for 250 staff; coordinated visa and labour-card renewals via PRO.",
  }),
  {
    matchingSkills: ["WPS (Wage Protection System)", "MOHRE contract registration", "Bayzat HRIS"],
    gap: "End-of-service gratuity calculations were supervised",
  },
  [
    rubricResult({
      candidateId: "cand_fatima_zahra",
      order: 1,
      score: 4.3,
      daysAgo: 11,
      headline: "Solid HR operations match with owned WPS and HRIS.",
      reasoning:
        "Owns the essential stack — WPS payroll, MOHRE registration, and Bayzat HRIS — for a comparable MEP workforce. Experience band fits. Gratuity/end-of-service work was supervised rather than owned, a small development area.",
      rawInput: "…owned monthly WPS runs and MOHRE registrations; maintained Bayzat HRIS for 250 staff…",
    }),
    testResult({
      candidateId: "cand_fatima_zahra",
      order: 2,
      pct: 85,
      daysAgo: 5,
      headline: "Aptitude & logic test: 85% — above the 80% bar.",
      reasoning:
        "Imported from the assessment platform. Strong numerical and logical-reasoning sub-scores; verbal slightly lower. Clears the 80% threshold for the gate.",
      rawInput: "Imported — TestGorilla Cognitive Ability: 85% (Numerical 88 · Logical 90 · Verbal 79).",
    }),
  ],
);

// Gate 2 — parked
add(
  applicant({
    id: "cand_nadia_hassan",
    name: "Nadia Hassan",
    headline: "HR & Admin Assistant · Retail Group",
    location: "Dubai, UAE",
    source: "Agency",
    status: "parked",
    currentGate: 2,
    createdDaysAgo: 14,
    resumeText:
      "HR & Admin Assistant with 2 years at a Dubai retail group. Maintained employee records, coordinated leave and attendance, and supported onboarding; visa processing was handled via an external PRO.",
  }),
  {
    matchingSkills: ["Records management and discipline", "Attendance, overtime, and leave tracking"],
    gap: "WPS and direct visa processing exposure is limited",
  },
  [
    rubricResult({
      candidateId: "cand_nadia_hassan",
      order: 1,
      score: 3.8,
      daysAgo: 13,
      headline: "Capable admin generalist with some HR-ops gaps.",
      reasoning:
        "Reliable on records, attendance, and onboarding support, and within the experience band. Visa processing was outsourced to a PRO and WPS ownership is thin, so essential coverage is partial. Parked pending a better-fit requisition.",
      rawInput: "…maintained records and coordinated leave/attendance; visa handled via external PRO…",
    }),
  ],
);

// Gate 3 — pending review (live borderline for the drawer demo)
add(
  applicant({
    id: "cand_kwame_mensah",
    name: "Kwame Mensah",
    headline: "HR Assistant · Contracting & Facilities",
    location: "Dubai, UAE",
    source: "LinkedIn",
    status: "pending_review",
    currentGate: 3,
    createdDaysAgo: 16,
    resumeText:
      "HR Assistant with 3 years across a Dubai contracting and facilities group. Handled labour-card processing, WPS submissions, and HRIS records; strong on process, developing on employee-relations nuance.",
  }),
  {
    matchingSkills: ["WPS (Wage Protection System)", "Visa and labour-card processes", "HRIS management"],
    gap: "Employee-relations judgement still developing",
  },
  [
    rubricResult({
      candidateId: "cand_kwame_mensah",
      order: 1,
      score: 4.0,
      daysAgo: 15,
      headline: "Clean essential-skill coverage across HR operations.",
      reasoning:
        "Covers labour-card processing, WPS submissions, and HRIS records for a comparable workforce — a clean pass on the essential criteria. Employee-relations depth is the one softer area to probe at interview.",
      rawInput: "…processed labour cards, filed WPS submissions, and maintained HRIS records…",
    }),
    testResult({
      candidateId: "cand_kwame_mensah",
      order: 2,
      pct: 82,
      daysAgo: 10,
      headline: "Aptitude & logic test: 82% — clears the bar.",
      reasoning:
        "Imported result. Consistent across numerical and logical reasoning, just above the 80% threshold. No sub-score of concern.",
      rawInput: "Imported — TestGorilla Cognitive Ability: 82% (Numerical 84 · Logical 83 · Verbal 79).",
    }),
    rubricResult({
      candidateId: "cand_kwame_mensah",
      order: 3,
      score: 3.0,
      daysAgo: 2,
      headline: "HR interview: strong process knowledge, thin on ER judgement.",
      reasoning:
        "Answered WPS, MOHRE, and records questions confidently and accurately. Situational employee-relations responses were generic and lacked the escalation judgement expected for first-line queries. A 3.0 lands Borderline — routed to Pending Review for a human decision.",
      rawInput:
        "Interview transcript excerpt: 'For a payroll dispute I would check the WPS SIF file first… for a grievance I would ask my manager what to do.'",
    }),
  ],
);

// Gate 4 — active, with a resolved borderline earlier in the arc
add(
  applicant({
    id: "cand_ayesha_khan",
    name: "Ayesha Khan",
    headline: "HR Assistant · HVAC Manufacturer",
    location: "Dubai, UAE",
    source: "LinkedIn",
    status: "active",
    currentGate: 4,
    createdDaysAgo: 20,
    resumeText:
      "HR Assistant with 4 years at a Dubai HVAC manufacturer. Owned onboarding/offboarding logistics, MOHRE registrations, and end-of-service calculations; a power Excel user supporting monthly payroll.",
  }),
  {
    matchingSkills: ["Onboarding/offboarding", "MOHRE contract registration", "Payroll administration"],
    gap: "HRIS was Excel-based rather than a platform",
  },
  [
    rubricResult({
      candidateId: "cand_ayesha_khan",
      order: 1,
      score: 4.2,
      daysAgo: 19,
      headline: "Strong operations match in a directly comparable HVAC setting.",
      reasoning:
        "Owns onboarding/offboarding, MOHRE registration, and end-of-service work at an HVAC manufacturer — an on-the-nose industry match. Payroll is Excel-driven rather than on a dedicated HRIS, the only real gap.",
      rawInput: "…owned onboarding/offboarding and MOHRE registrations; ran end-of-service calcs in Excel…",
    }),
    testResult({
      candidateId: "cand_ayesha_khan",
      order: 2,
      pct: 86,
      daysAgo: 15,
      headline: "Aptitude & logic test: 86% — comfortably clears.",
      reasoning:
        "Imported result. Balanced sub-scores with a strong numerical showing, well above the 80% threshold.",
      rawInput: "Imported — TestGorilla Cognitive Ability: 86% (Numerical 90 · Logical 85 · Verbal 83).",
    }),
    rubricResult({
      candidateId: "cand_ayesha_khan",
      order: 3,
      score: 3.0,
      daysAgo: 10,
      headline: "HR interview: capable but hesitant under structured questions.",
      reasoning:
        "Technical answers on payroll and compliance were sound, but delivery was hesitant and a couple of ER scenarios were under-developed. Scored 3.0 (Borderline). Resolved to Pass after a follow-up call confirmed the capability.",
      rawInput:
        "Interview transcript excerpt: 'End-of-service is 21 days' basic pay per year for the first five years… for a grievance, I would document it and involve the manager.'",
      human: decision(
        "resolve",
        "pass",
        9,
        "Follow-up call confirmed solid ER instincts — interview nerves, not a capability gap.",
      ),
    }),
    testResult({
      candidateId: "cand_ayesha_khan",
      order: 4,
      pct: 88,
      daysAgo: 3,
      headline: "Functional HR test: 88% — strong on payroll & compliance scenarios.",
      reasoning:
        "Imported role-specific test. High marks on payroll calculation and UAE-compliance scenarios; records-management section slightly lower. Clears the 80% bar.",
      rawInput: "Imported — Functional HR Assessment: 88% (Payroll 92 · Compliance 90 · Records 82).",
    }),
  ],
);

// Gate 5 — active
add(
  applicant({
    id: "cand_daniel_okonkwo",
    name: "Daniel Okonkwo",
    headline: "Senior HR Assistant · Contracting",
    location: "Dubai, UAE",
    source: "Referral",
    status: "active",
    currentGate: 5,
    createdDaysAgo: 24,
    resumeText:
      "Senior HR Assistant with 5 years across UAE contracting firms. End-to-end visa/labour-card processing, WPS, Bayzat HRIS, and recruitment coordination; mentored two junior admins.",
  }),
  {
    matchingSkills: ["Visa and labour-card processes", "WPS (Wage Protection System)", "Bayzat HRIS"],
    gap: "Experience slightly above the entry (1–4 yr) target band",
  },
  [
    rubricResult({
      candidateId: "cand_daniel_okonkwo",
      order: 1,
      score: 4.5,
      daysAgo: 23,
      headline: "Comprehensive HR operations coverage with mentoring depth.",
      reasoning:
        "End-to-end ownership across visa/labour-card, WPS, and Bayzat HRIS plus recruitment coordination — top-tier essential coverage. Five years is marginally above the entry target band, but the strength of fit outweighs it.",
      rawInput: "…owned visa/labour-card and WPS end to end; ran Bayzat HRIS; mentored two junior admins…",
    }),
    testResult({
      candidateId: "cand_daniel_okonkwo",
      order: 2,
      pct: 84,
      daysAgo: 18,
      headline: "Aptitude & logic test: 84% — clears the bar.",
      reasoning: "Imported result. Steady across all sub-scores, above the 80% threshold.",
      rawInput: "Imported — TestGorilla Cognitive Ability: 84% (Numerical 86 · Logical 85 · Verbal 81).",
    }),
    rubricResult({
      candidateId: "cand_daniel_okonkwo",
      order: 3,
      score: 4.2,
      daysAgo: 12,
      headline: "HR interview: strong operational command and clear judgement.",
      reasoning:
        "Precise on WPS, MOHRE, and end-of-service, and gave well-structured employee-relations answers with sensible escalation. A confident, clean pass.",
      rawInput:
        "Interview transcript excerpt: 'I reconcile the SIF against attendance before every WPS run… for a grievance I document, acknowledge within 24 hours, then escalate per policy.'",
    }),
    testResult({
      candidateId: "cand_daniel_okonkwo",
      order: 4,
      pct: 90,
      daysAgo: 7,
      headline: "Functional HR test: 90% — excellent across the board.",
      reasoning:
        "Imported role-specific test. Uniformly high on payroll, compliance, and records scenarios. Well clear of the threshold.",
      rawInput: "Imported — Functional HR Assessment: 90% (Payroll 92 · Compliance 91 · Records 88).",
    }),
    rubricResult({
      candidateId: "cand_daniel_okonkwo",
      order: 5,
      score: 4.1,
      daysAgo: 2,
      headline: "Dept-manager interview: strong operational fit and ownership.",
      reasoning:
        "The hiring manager rated ownership and reliability highly and noted a good grasp of the factory/office split. Minor note on HRIS-migration experience. A solid pass.",
      rawInput:
        "Interview transcript excerpt: 'I would keep factory and office attendance streams separate but reconcile both before payroll cut-off…'",
    }),
  ],
);

// Gate 6 — active
add(
  applicant({
    id: "cand_omar_abdullah",
    name: "Omar Abdullah",
    headline: "HR Assistant · MEP Group",
    location: "Dubai, UAE",
    source: "LinkedIn",
    status: "active",
    currentGate: 6,
    createdDaysAgo: 28,
    resumeText:
      "HR Assistant with 3 years at a Dubai MEP group; detail-oriented across WPS, MOHRE, and HRIS with a clean compliance record and strong attention to renewals and expiries.",
  }),
  {
    matchingSkills: ["WPS (Wage Protection System)", "MOHRE contract registration", "HRIS management"],
    gap: "Recruitment-coordination exposure is modest",
  },
  [
    rubricResult({
      candidateId: "cand_omar_abdullah",
      order: 1,
      score: 4.3,
      daysAgo: 27,
      headline: "Detail-oriented HR operations match with a clean record.",
      reasoning:
        "Strong essential coverage — WPS, MOHRE, HRIS — with a track record on renewals and expiries that suits the compliance-heavy role. Recruitment coordination is lighter but is an important, not essential, area.",
      rawInput: "…tracked visa/labour-card expiries meticulously; filed WPS and MOHRE with a clean audit record…",
    }),
    testResult({
      candidateId: "cand_omar_abdullah",
      order: 2,
      pct: 88,
      daysAgo: 22,
      headline: "Aptitude & logic test: 88% — comfortably clears.",
      reasoning: "Imported result. Strong logical reasoning; balanced elsewhere. Above threshold.",
      rawInput: "Imported — TestGorilla Cognitive Ability: 88% (Numerical 87 · Logical 92 · Verbal 84).",
    }),
    rubricResult({
      candidateId: "cand_omar_abdullah",
      order: 3,
      score: 4.0,
      daysAgo: 16,
      headline: "HR interview: accurate and compliance-first.",
      reasoning:
        "Confident, correct answers on WPS and MOHRE with a compliance-first instinct. ER answers were adequate. A clean pass at the threshold.",
      rawInput: "Interview transcript excerpt: 'I never let a labour card lapse — I run a 60-day expiry report weekly.'",
    }),
    testResult({
      candidateId: "cand_omar_abdullah",
      order: 4,
      pct: 85,
      daysAgo: 10,
      headline: "Functional HR test: 85% — strong on compliance.",
      reasoning: "Imported role-specific test. Compliance and records strong; payroll solid. Clears the bar.",
      rawInput: "Imported — Functional HR Assessment: 85% (Payroll 84 · Compliance 90 · Records 86).",
    }),
    rubricResult({
      candidateId: "cand_omar_abdullah",
      order: 5,
      score: 4.2,
      daysAgo: 5,
      headline: "Dept-manager interview: reliable and process-driven.",
      reasoning:
        "The manager valued the meticulous renewal-tracking approach and clean compliance record. Comfortable with the factory/office split. A confident pass.",
      rawInput: "Interview transcript excerpt: 'I keep a single expiry calendar for the whole workforce and review it every Sunday.'",
    }),
    rubricResult({
      candidateId: "cand_omar_abdullah",
      order: 6,
      score: 4.4,
      daysAgo: 1,
      headline: "GM interview: confident, compliance-first, culturally aligned.",
      reasoning:
        "The GM was impressed by the discipline around expiries and the compliance-first mindset, and felt the working style fit the group culture. A strong final-gate pass; ready for a conditional offer.",
      rawInput:
        "Interview transcript excerpt: 'Compliance is not a cost — a lapsed labour card can shut a site. I treat it as the priority.'",
    }),
  ],
);

// Offer — passed all six gates, conditional offer drafted
add(
  applicant({
    id: "cand_sana_sheikh",
    name: "Sana Sheikh",
    headline: "HR Assistant · Facilities Management",
    location: "Dubai, UAE",
    source: "LinkedIn",
    status: "active",
    currentGate: 6,
    createdDaysAgo: 34,
    resumeText:
      "HR Assistant with 4 years at a Dubai facilities-management firm; owned WPS, visa processing, and HRIS end to end, with strong recruitment-coordination and onboarding experience.",
  }),
  {
    matchingSkills: ["WPS (Wage Protection System)", "Recruitment coordination", "HRIS management"],
    gap: "No manufacturing-sector exposure specifically",
  },
  [
    rubricResult({
      candidateId: "cand_sana_sheikh",
      order: 1,
      score: 4.4,
      daysAgo: 33,
      headline: "Well-rounded HR operations and coordination match.",
      reasoning:
        "Owns WPS, visa processing, and HRIS while also strong on recruitment coordination and onboarding — broad coverage across essential and important skills. Sector is facilities rather than manufacturing, a minor contextual gap.",
      rawInput: "…owned WPS and visa processing; ran HRIS and recruitment coordination end to end…",
    }),
    testResult({
      candidateId: "cand_sana_sheikh",
      order: 2,
      pct: 87,
      daysAgo: 29,
      headline: "Aptitude & logic test: 87% — comfortably clears.",
      reasoning: "Imported result. Strong across sub-scores, well above threshold.",
      rawInput: "Imported — TestGorilla Cognitive Ability: 87% (Numerical 88 · Logical 89 · Verbal 84).",
    }),
    rubricResult({
      candidateId: "cand_sana_sheikh",
      order: 3,
      score: 4.1,
      daysAgo: 22,
      headline: "HR interview: articulate and well-judged.",
      reasoning:
        "Clear, accurate answers on WPS and MOHRE with genuinely thoughtful employee-relations judgement. A confident pass.",
      rawInput: "Interview transcript excerpt: 'I acknowledge every employee query within a day, even if the fix takes longer.'",
    }),
    testResult({
      candidateId: "cand_sana_sheikh",
      order: 4,
      pct: 89,
      daysAgo: 15,
      headline: "Functional HR test: 89% — excellent.",
      reasoning: "Imported role-specific test. High across payroll, compliance, and records. Well clear.",
      rawInput: "Imported — Functional HR Assessment: 89% (Payroll 90 · Compliance 88 · Records 89).",
    }),
    rubricResult({
      candidateId: "cand_sana_sheikh",
      order: 5,
      score: 4.3,
      daysAgo: 9,
      headline: "Dept-manager interview: strong fit, immediately useful.",
      reasoning:
        "The manager felt she could contribute from day one and rated communication and ownership highly. A strong pass.",
      rawInput: "Interview transcript excerpt: 'I'd map every recurring renewal in the first week and build one tracker.'",
    }),
    rubricResult({
      candidateId: "cand_sana_sheikh",
      order: 6,
      score: 4.2,
      daysAgo: 3,
      headline: "GM interview: polished and aligned; recommend offer.",
      reasoning:
        "The GM was confident in the operational fit and culture alignment and recommended proceeding to a conditional offer. A clean final-gate pass.",
      rawInput: "Interview transcript excerpt: 'I want a role where compliance and people-care sit together — this is that.'",
    }),
  ],
);

// Hired — recruiter overrode an AI Fail at Gate 3 (ADR 0003 sovereignty story)
add(
  applicant({
    id: "cand_reem_alsuwaidi",
    name: "Reem Al-Suwaidi",
    headline: "HR Professional · Government-backed Manufacturing",
    location: "Dubai, UAE",
    source: "Referral",
    status: "hired",
    currentGate: 6,
    createdDaysAgo: 40,
    resumeText:
      "Emirati HR professional with 3 years in government-backed manufacturing; fluent Arabic and English, strong on MOHRE, Emiratisation, and labour-law compliance, with hands-on WPS and visa processing.",
  }),
  {
    matchingSkills: ["UAE Labour Law knowledge", "MOHRE contract registration", "Arabic"],
    gap: "Structured-interview delivery under-represents her practical strength",
  },
  [
    rubricResult({
      candidateId: "cand_reem_alsuwaidi",
      order: 1,
      score: 4.4,
      daysAgo: 39,
      headline: "Excellent compliance and labour-law match; bilingual asset.",
      reasoning:
        "Deep UAE Labour Law and MOHRE knowledge with fluent Arabic — a strong cultural and compliance fit for the workforce. Hands-on WPS and visa processing round out the essentials. A confident pass.",
      rawInput: "…owned MOHRE registration and labour-law compliance; hands-on WPS and visa processing; fluent Arabic…",
    }),
    testResult({
      candidateId: "cand_reem_alsuwaidi",
      order: 2,
      pct: 84,
      daysAgo: 34,
      headline: "Aptitude & logic test: 84% — clears the bar.",
      reasoning: "Imported result. Steady across sub-scores, above the 80% threshold.",
      rawInput: "Imported — TestGorilla Cognitive Ability: 84% (Numerical 83 · Logical 86 · Verbal 84).",
    }),
    rubricResult({
      candidateId: "cand_reem_alsuwaidi",
      order: 3,
      score: 2.2,
      daysAgo: 26,
      headline: "HR interview: below bar on structured delivery.",
      reasoning:
        "Under structured questioning the answers were brief and hesitant, and several scenarios were left incomplete, producing a low interview score. The AI outcome is a clear Fail — but see the recruiter's override, which weighs her documented practical record.",
      rawInput:
        "Interview transcript excerpt: 'Sorry — I know this in practice but I'm nervous… WPS, yes, I run it every month.'",
      human: decision(
        "override",
        "pass",
        25,
        "AI penalised a nervous structured interview. Her practical WPS/MOHRE track record and two manager references clearly clear the bar; advancing.",
      ),
    }),
    testResult({
      candidateId: "cand_reem_alsuwaidi",
      order: 4,
      pct: 90,
      daysAgo: 18,
      headline: "Functional HR test: 90% — vindicates the override.",
      reasoning:
        "Imported role-specific test. Top marks on compliance and payroll — the practical strength the structured interview missed. Well clear of the threshold.",
      rawInput: "Imported — Functional HR Assessment: 90% (Payroll 89 · Compliance 94 · Records 88).",
    }),
    rubricResult({
      candidateId: "cand_reem_alsuwaidi",
      order: 5,
      score: 4.3,
      daysAgo: 10,
      headline: "Dept-manager interview: assured on home ground.",
      reasoning:
        "Far more assured in a conversational setting; the manager praised her compliance instincts and bilingual employee-relations. A strong pass that confirms the override call.",
      rawInput: "Interview transcript excerpt: 'With Arabic-speaking staff I can resolve most queries first-line, no escalation needed.'",
    }),
    rubricResult({
      candidateId: "cand_reem_alsuwaidi",
      order: 6,
      score: 4.5,
      daysAgo: 5,
      headline: "GM interview: outstanding fit; hire.",
      reasoning:
        "The GM rated her the strongest compliance mind in the pool and highlighted the Emiratisation and language advantages. A top final-gate score; hired on a conditional offer.",
      rawInput: "Interview transcript excerpt: 'I want to build the compliance backbone here properly, from the ground up.'",
    }),
  ],
);

// Rejected — clear AI Fail at Gate 3, confirmed by the recruiter
add(
  applicant({
    id: "cand_bilal_ahmed",
    name: "Bilal Ahmed",
    headline: "HR Assistant · SME",
    location: "Dubai, UAE",
    source: "Agency",
    status: "rejected",
    currentGate: 3,
    createdDaysAgo: 18,
    resumeText:
      "HR Assistant with 2 years at a Dubai SME; solid on records and attendance, developing on payroll and compliance, with limited exposure to WPS submissions.",
  }),
  {
    matchingSkills: ["Records management and discipline", "Attendance, overtime, and leave tracking"],
    gap: "Payroll, WPS, and compliance depth below the role's bar",
  },
  [
    rubricResult({
      candidateId: "cand_bilal_ahmed",
      order: 1,
      score: 3.9,
      daysAgo: 17,
      headline: "Records-strong generalist; payroll/compliance lighter.",
      reasoning:
        "Reliable on records and attendance and within the experience band, clearing Gate 1 on the strength of the important cluster. Payroll and WPS involvement is limited — flagged to probe downstream.",
      rawInput: "…maintained records and attendance for an SME; limited WPS submission experience…",
    }),
    testResult({
      candidateId: "cand_bilal_ahmed",
      order: 2,
      pct: 81,
      daysAgo: 12,
      headline: "Aptitude & logic test: 81% — just clears.",
      reasoning: "Imported result. Narrowly above the 80% threshold; verbal and numerical both borderline-strong.",
      rawInput: "Imported — TestGorilla Cognitive Ability: 81% (Numerical 82 · Logical 83 · Verbal 78).",
    }),
    rubricResult({
      candidateId: "cand_bilal_ahmed",
      order: 3,
      score: 2.1,
      daysAgo: 4,
      headline: "HR interview: below bar on compliance depth and ER judgement.",
      reasoning:
        "Could not accurately describe a WPS run or MOHRE registration steps, and employee-relations answers lacked structure. Against a compliance-heavy role this is a clear miss. AI Fail, confirmed by the recruiter after review.",
      rawInput:
        "Interview transcript excerpt: 'WPS is the salary system… I'm not sure of the exact submission steps, our accountant did that.'",
      human: decision("resolve", "fail", 3),
    }),
  ],
);

export const seedCandidates = candidates;
export const seedGateResults = gateResults;

// ---------------------------------------------------------------------------
// Comms drafts (LLM-draft → approve → simulated send) and composite summaries.
// ---------------------------------------------------------------------------
export const seedCommsDrafts: CommsDraft[] = [
  {
    id: "comms_sana_offer",
    candidateId: "cand_sana_sheikh",
    trigger: "offer",
    status: "approved",
    subject: "Conditional Offer — HR Assistant, Prime Focus Group (Prime AC)",
    body: "Dear Sana,\n\nCongratulations — following your interviews across our recruitment gates, we are delighted to extend a conditional offer for the HR Assistant role at Prime Focus Group (Prime AC) in Dubai.\n\nThis offer is conditional on standard pre-employment checks and document verification. A full breakdown of compensation, benefits, and start date will follow in your formal contract.\n\nPlease let us know if you have any questions. We would be thrilled to have you join the HR team.\n\nWarm regards,\nAisha Rahman\nTalent Acquisition · Contra6 Recruit",
    draftedAt: iso(2),
    approvedAt: iso(1),
    sentAt: null,
  },
  {
    id: "comms_reem_offer",
    candidateId: "cand_reem_alsuwaidi",
    trigger: "offer",
    status: "sent",
    subject: "Conditional Offer — HR Assistant, Prime Focus Group (Prime AC)",
    body: "Dear Reem,\n\nCongratulations — we are delighted to extend a conditional offer for the HR Assistant role at Prime Focus Group (Prime AC). Your compliance expertise and bilingual employee-relations strengths stood out throughout the process.\n\nThis offer is conditional on standard pre-employment checks. Your formal contract with full details will follow shortly.\n\nWe are excited to welcome you to the team.\n\nWarm regards,\nAisha Rahman\nTalent Acquisition · Contra6 Recruit",
    draftedAt: iso(5),
    approvedAt: iso(5),
    sentAt: iso(4),
  },
  {
    id: "comms_bilal_rejection",
    candidateId: "cand_bilal_ahmed",
    trigger: "rejection",
    status: "sent",
    subject: "Update on your application — HR Assistant, Prime Focus Group (Prime AC)",
    body: "Dear Bilal,\n\nThank you for taking the time to interview for the HR Assistant role at Prime Focus Group (Prime AC), and for your interest in the position.\n\nAfter careful consideration, we have decided not to move forward on this occasion. The role calls for deeper hands-on payroll and UAE-compliance experience than your current background reflects. This is not a reflection of your potential, and we would encourage you to apply again as your experience grows.\n\nWe wish you every success in your search.\n\nKind regards,\nAisha Rahman\nTalent Acquisition · Contra6 Recruit",
    draftedAt: iso(4),
    approvedAt: iso(4),
    sentAt: iso(3),
  },
];

export const seedCompositeSummaries: CompositeSummary[] = [
  {
    candidateId: "cand_reem_alsuwaidi",
    terminalState: "hired",
    summary:
      "Reem Al-Suwaidi progressed to a successful hire across all six gates. She entered with an excellent Gate 1 match (4.4) on UAE Labour Law, MOHRE, and bilingual employee-relations, and cleared the aptitude test at 84%. Her one setback was a low HR interview (AI Fail, 2.2) driven by nervous structured-interview delivery — which the recruiter overrode to Pass, citing a strong documented WPS/MOHRE record and two manager references. That judgement was vindicated: she scored 90% on the functional test and passed the dept-manager (4.3) and GM (4.5) interviews with the highest final-gate mark in the pool. A clear case of human judgement correctly diverging from the AI on interview-style, not capability.",
    generatedAt: iso(4),
  },
  {
    candidateId: "cand_bilal_ahmed",
    terminalState: "rejected",
    summary:
      "Bilal Ahmed cleared the first two gates but was not advanced past the HR interview. His Gate 1 match (3.9) rested on records and attendance strengths, with payroll and WPS already flagged as light, and he narrowly cleared the aptitude test at 81%. The HR interview confirmed the concern: he could not describe a WPS run or MOHRE registration accurately, and employee-relations answers lacked structure (AI Fail, 2.1). The recruiter reviewed and confirmed the outcome. The gap between his records-focused background and this compliance-heavy role was the deciding factor.",
    generatedAt: iso(3),
  },
];
