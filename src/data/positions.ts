import {
  deriveOutcome,
  type Candidate,
  type GateDefinition,
  type GateResult,
  type GateType,
  type JobRole,
  type StructuredJD,
} from "@/schema";
import { DEMO_NOW, EVALUATOR_VERSION, JD_ID } from "@/lib/constants";
import {
  candidateFacets,
  gateDefinitions as hrGateDefinitions,
  seedCandidates,
  seedGateResults,
  structuredJD as hrJD,
  type CandidateFacets,
} from "./seed";
import { extraHrCandidates, extraHrResults, extraHrFacets } from "./extra-candidates";

// A requisition: its structured JD, ordered gates, and dashboard metadata.
export interface Position {
  id: string;
  jd: StructuredJD;
  gateDefinitions: GateDefinition[];
  department: string;
  location: string;
  status: "open" | "on_hold";
  openedDaysAgo: number;
}

const COMPANY = { name: "Prime Focus Group (Prime AC)", size: "medium", stage: "mature" } as const;

function iso(daysAgo: number, hour = 10): string {
  const d = new Date(DEMO_NOW);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

const GATE_TYPES: GateType[] = [
  "resume_match",
  "test_import",
  "interview_eval",
  "test_import",
  "interview_eval",
  "interview_eval",
];

export const DEFAULT_GATE_LABELS = [
  "Pre-screen",
  "Aptitude Test",
  "First Interview",
  "Functional Test",
  "Manager Interview",
  "Final Interview",
] as const;

export function makeGateDefinitions(jdId: string, labels: readonly string[]): GateDefinition[] {
  return [1, 2, 3, 4, 5, 6].map((order, i) => {
    const type = GATE_TYPES[i]!;
    const isTest = type === "test_import";
    return {
      id: `${jdId}_gate_${order}`,
      jdId,
      order,
      type,
      label: labels[i]!,
      scoreUnit: isTest ? "percentage" : "rubric_1_5",
      passThreshold: isTest ? 80 : 4,
      borderlineFloor: isTest ? null : 3,
      promptContext: null,
    };
  });
}

// ---------------------------------------------------------------------------
// Sibling requisitions (lighter than the flagship HR role, but fully navigable)
// ---------------------------------------------------------------------------

interface LightSpec {
  id: string;
  name: string;
  headline: string;
  source: string;
  stage: Candidate["stage"];
  status: Candidate["status"];
  currentGate: number;
  resumeText: string;
  facets: CandidateFacets;
  gates: {
    order: number;
    score: number;
    headline: string;
    reasoning: string;
    rawInput: string;
    daysAgo: number;
  }[];
}

function buildPosition(
  cfg: {
    id: string;
    jobRole: JobRole;
    department: string;
    location: string;
    status: Position["status"];
    openedDaysAgo: number;
    gateLabels: readonly string[];
  },
  specs: LightSpec[],
): { position: Position; candidates: Candidate[]; results: GateResult[]; facets: Record<string, CandidateFacets> } {
  const gateDefinitions = makeGateDefinitions(cfg.id, cfg.gateLabels);
  const jd: StructuredJD = {
    id: cfg.id,
    jobRole: cfg.jobRole,
    frozen: true,
    fieldSources: {},
    createdAt: iso(cfg.openedDaysAgo + 3),
    frozenAt: iso(cfg.openedDaysAgo),
  };
  const candidates: Candidate[] = [];
  const results: GateResult[] = [];
  const facets: Record<string, CandidateFacets> = {};

  for (const s of specs) {
    candidates.push({
      id: s.id,
      jdId: cfg.id,
      name: s.name,
      headline: s.headline,
      location: cfg.location,
      avatarUrl: null,
      source: s.source,
      resumeText: s.resumeText,
      stage: s.stage,
      status: s.status,
      currentGate: s.currentGate as Candidate["currentGate"],
      createdAt: iso(s.gates[0]?.daysAgo ?? cfg.openedDaysAgo),
    });
    facets[s.id] = s.facets;
    for (const g of s.gates) {
      const def = gateDefinitions.find((d) => d.order === g.order)!;
      results.push({
        id: `res_${s.id}_g${g.order}`,
        candidateId: s.id,
        gateId: def.id,
        gateOrder: g.order,
        score: g.score,
        scoreUnit: def.scoreUnit,
        aiOutcome: deriveOutcome(g.score, def),
        headline: g.headline,
        reasoning: g.reasoning,
        rawInput: g.rawInput,
        evaluatorVersion: def.scoreUnit === "percentage" ? "import_v2.0" : EVALUATOR_VERSION,
        evaluatedAt: iso(g.daysAgo),
        jdId: cfg.id,
      });
    }
  }

  const position: Position = {
    id: cfg.id,
    jd,
    gateDefinitions,
    department: cfg.department,
    location: cfg.location,
    status: cfg.status,
    openedDaysAgo: cfg.openedDaysAgo,
  };
  return { position, candidates, results, facets };
}

// ---- Accountant ------------------------------------------------------------
const accountant = buildPosition(
  {
    id: "jd_accountant_prime_ac",
    department: "Finance",
    location: "Dubai, UAE",
    status: "open",
    openedDaysAgo: 9,
    gateLabels: [
      "Pre-screen",
      "Aptitude & Numeracy Test",
      "Finance Interview",
      "Accounting Skills Test",
      "Finance-Manager Interview",
      "CFO Interview",
    ],
    jobRole: {
      role: "Accountant",
      company: COMPANY,
      industry: ["manufacturing", "industrial"],
      responsibilities: [
        "Manage accounts payable/receivable and monthly closings",
        "Prepare VAT returns and ensure UAE FTA compliance",
        "Reconcile bank statements and maintain the general ledger",
        "Support WPS payroll and end-of-service calculations",
        "Assist with budgeting and management reporting",
      ],
      skills: [
        { skill: "UAE VAT & FTA compliance", priority: "essential", proficiency_level: null },
        { skill: "General ledger & reconciliations", priority: "essential", proficiency_level: null },
        { skill: "Accounts payable/receivable", priority: "essential", proficiency_level: null },
        { skill: "Microsoft Excel", priority: "essential", proficiency_level: "advanced" },
        { skill: "Financial reporting", priority: "important", proficiency_level: null },
        { skill: "WPS payroll support", priority: "important", proficiency_level: null },
        { skill: "Tally / ERP systems", priority: "valuable", proficiency_level: null },
      ],
      experience: { level: "mid", years_total: { min: 2, max: 5 }, years_relevant: { min: 2, max: 5 } },
      location: { cities: ["Dubai"], countries: ["United Arab Emirates"], remote_options: "on_site" },
      employment_details: { type: "full_time" },
    },
  },
  [
    {
      id: "cand_arjun_menon",
      name: "Arjun Menon",
      headline: "Senior Accountant · Manufacturing",
      source: "LinkedIn",
      stage: "prospect",
      status: "active",
      currentGate: 1,
      resumeText:
        "Accountant with 4 years at a Dubai manufacturing group. Owned AP/AR, monthly closings, VAT returns on the FTA portal, and bank reconciliations; power Excel user supporting WPS payroll.",
      facets: {
        matchingSkills: ["UAE VAT & FTA compliance", "General ledger & reconciliations", "Microsoft Excel"],
        gap: "No ERP migration experience noted",
      },
      gates: [
        {
          order: 1,
          score: 4.5,
          daysAgo: 2,
          headline: "Strong finance match; VAT, GL, and reconciliations owned.",
          reasoning:
            "Directly covers the essential finance stack: UAE VAT/FTA filing, general-ledger ownership, and reconciliations at a comparable manufacturer. Advanced Excel and WPS support round it out. Only gap is ERP migration exposure.",
          rawInput: "…filed quarterly VAT on the FTA portal and owned monthly closings and bank recs…",
        },
      ],
    },
    {
      id: "cand_fatima_noor",
      name: "Fatima Noor",
      headline: "Accountant · Trading",
      source: "LinkedIn",
      stage: "prospect",
      status: "active",
      currentGate: 1,
      resumeText:
        "Accountant with 3 years in a Dubai trading firm. Handled AP/AR, VAT, and reporting on Tally; supported audits and month-end.",
      facets: {
        matchingSkills: ["Accounts payable/receivable", "UAE VAT & FTA compliance", "Tally / ERP systems"],
        gap: "Manufacturing-sector costing exposure limited",
      },
      gates: [
        {
          order: 1,
          score: 4.0,
          daysAgo: 3,
          headline: "Solid all-round accountant with Tally depth.",
          reasoning:
            "Covers AP/AR, VAT, and reporting with hands-on Tally, and supports audits. Sector is trading rather than manufacturing, so costing exposure is lighter. A clean pass.",
          rawInput: "…managed AP/AR and VAT on Tally; supported year-end audits…",
        },
      ],
    },
    {
      id: "cand_george_thomas",
      name: "George Thomas",
      headline: "Junior Accountant · Contracting",
      source: "Agency",
      stage: "prospect",
      status: "pending_review",
      currentGate: 1,
      resumeText:
        "Junior Accountant with 2 years at a Dubai contracting company. Assisted with AP/AR and data entry; developing on VAT and reconciliations.",
      facets: {
        matchingSkills: ["Accounts payable/receivable", "Microsoft Excel"],
        gap: "VAT filing and GL ownership not yet demonstrated",
      },
      gates: [
        {
          order: 1,
          score: 3.0,
          daysAgo: 3,
          headline: "Early-career; core finance ownership unproven.",
          reasoning:
            "Assisted on AP/AR and Excel work but has not owned VAT filing or general-ledger reconciliations, the essential skills for this role. The score lands Borderline, routing to a human decision.",
          rawInput: "…assisted AP/AR and month-end data entry; some VAT support…",
        },
      ],
    },
    {
      id: "cand_priyanka_rao",
      name: "Priyanka Rao",
      headline: "Accountant · Manufacturing",
      source: "LinkedIn",
      stage: "applicant",
      status: "active",
      currentGate: 3,
      resumeText:
        "Accountant with 5 years across UAE manufacturing firms. Owned full-cycle accounting, VAT, WPS, and management reporting on SAP.",
      facets: {
        matchingSkills: ["UAE VAT & FTA compliance", "Financial reporting", "General ledger & reconciliations"],
        gap: "Slightly above the target experience band",
      },
      gates: [
        {
          order: 1,
          score: 4.4,
          daysAgo: 8,
          headline: "Comprehensive manufacturing-finance match on SAP.",
          reasoning:
            "Full-cycle accounting, VAT, WPS, and reporting on SAP at comparable manufacturers — top-tier essential coverage. Five years sits just above the target band.",
          rawInput: "…owned full-cycle accounting, VAT, and WPS on SAP for a manufacturing group…",
        },
        {
          order: 2,
          score: 88,
          daysAgo: 5,
          headline: "Aptitude & numeracy test: 88% — comfortably clears.",
          reasoning: "Imported result. Strong numerical reasoning; balanced elsewhere, well above the 80% bar.",
          rawInput: "Imported — Mercer Mettl Numerical Ability: 88%.",
        },
      ],
    },
    {
      id: "cand_lena_haddad",
      name: "Lena Haddad",
      headline: "Accountant · Facilities",
      source: "Referral",
      stage: "applicant",
      status: "active",
      currentGate: 2,
      resumeText:
        "Accountant with 3 years at a Dubai facilities-management firm. Handled AP/AR, VAT, and reconciliations; strong Excel and reporting.",
      facets: {
        matchingSkills: ["General ledger & reconciliations", "Financial reporting", "Microsoft Excel"],
        gap: "VAT was supported rather than owned end to end",
      },
      gates: [
        {
          order: 1,
          score: 4.1,
          daysAgo: 7,
          headline: "Reliable accountant with strong reporting and Excel.",
          reasoning:
            "Covers AP/AR, reconciliations, and reporting with strong Excel. VAT was a supporting role rather than fully owned — the one watch-item. A clean pass.",
          rawInput: "…handled AP/AR and reconciliations; supported VAT filing…",
        },
        {
          order: 2,
          score: 84,
          daysAgo: 3,
          headline: "Aptitude & numeracy test: 84% — clears the bar.",
          reasoning: "Imported result. Steady across sub-scores, above the 80% threshold.",
          rawInput: "Imported — Mercer Mettl Numerical Ability: 84%.",
        },
      ],
    },
  ],
);

// ---- Production Supervisor -------------------------------------------------
const production = buildPosition(
  {
    id: "jd_production_supervisor_prime_ac",
    department: "Manufacturing",
    location: "Dubai, UAE",
    status: "open",
    openedDaysAgo: 6,
    gateLabels: [
      "Pre-screen",
      "Aptitude & Safety Test",
      "Operations Interview",
      "Technical Skills Test",
      "Plant-Manager Interview",
      "GM Interview",
    ],
    jobRole: {
      role: "Production Supervisor",
      company: COMPANY,
      industry: ["HVAC/ductwork manufacturing", "manufacturing"],
      responsibilities: [
        "Supervise the HVAC/ductwork factory floor and shift schedules",
        "Enforce health, safety, and quality standards",
        "Plan production targets and track daily output",
        "Manage a blue-collar workforce of 40+ operators",
        "Coordinate with stores and maintenance teams",
      ],
      skills: [
        { skill: "HVAC/ductwork manufacturing", priority: "essential", proficiency_level: null },
        { skill: "Production planning", priority: "essential", proficiency_level: null },
        { skill: "Health & safety (HSE)", priority: "essential", proficiency_level: null },
        { skill: "Team leadership", priority: "essential", proficiency_level: null },
        { skill: "Quality control", priority: "important", proficiency_level: null },
        { skill: "Lean manufacturing", priority: "valuable", proficiency_level: null },
      ],
      experience: {
        level: "senior",
        years_total: { min: 5, max: 10 },
        years_relevant: { min: 5, max: 10 },
        leadership: { required: true, team_size: { min: 20, max: 60 }, priority: "essential" },
      },
      location: { cities: ["Dubai"], countries: ["United Arab Emirates"], remote_options: "on_site" },
      employment_details: { type: "full_time" },
    },
  },
  [
    {
      id: "cand_ibrahim_khalil",
      name: "Ibrahim Khalil",
      headline: "Production Supervisor · Ductwork",
      source: "LinkedIn",
      stage: "prospect",
      status: "active",
      currentGate: 1,
      resumeText:
        "Production Supervisor with 8 years in HVAC/ductwork manufacturing in the UAE. Ran two shifts of 50+ operators, owned HSE and quality, and hit output targets consistently.",
      facets: {
        matchingSkills: ["HVAC/ductwork manufacturing", "Team leadership", "Health & safety (HSE)"],
        gap: "Formal lean certification not held",
      },
      gates: [
        {
          order: 1,
          score: 4.6,
          daysAgo: 2,
          headline: "Excellent direct match; ductwork, HSE, and large-team leadership.",
          reasoning:
            "On-the-nose experience: HVAC/ductwork manufacturing, HSE ownership, and leading 50+ operators across shifts. Meets the leadership requirement squarely. Only gap is a formal lean certification.",
          rawInput: "…supervised two shifts of 50+ operators in ductwork manufacturing; owned HSE and quality…",
        },
      ],
    },
    {
      id: "cand_samuel_okoro",
      name: "Samuel Okoro",
      headline: "Shift Supervisor · Sheet Metal",
      source: "Agency",
      stage: "prospect",
      status: "active",
      currentGate: 1,
      resumeText:
        "Shift Supervisor with 6 years in sheet-metal fabrication. Led teams of 30, enforced safety, and tracked production KPIs.",
      facets: {
        matchingSkills: ["Production planning", "Team leadership", "Quality control"],
        gap: "Ductwork-specific experience is adjacent, not direct",
      },
      gates: [
        {
          order: 1,
          score: 3.9,
          daysAgo: 3,
          headline: "Strong supervisor; ductwork experience is adjacent.",
          reasoning:
            "Solid on production planning, safety, and leading 30-strong teams in sheet-metal fabrication — closely adjacent to ductwork. Direct HVAC/ductwork exposure is the main gap. A pass.",
          rawInput: "…led sheet-metal fabrication shifts of 30; tracked KPIs and enforced safety…",
        },
      ],
    },
    {
      id: "cand_rashid_ali",
      name: "Rashid Ali",
      headline: "Line Lead · Manufacturing",
      source: "LinkedIn",
      stage: "prospect",
      status: "active",
      currentGate: 1,
      resumeText:
        "Line Lead with 4 years in general manufacturing. Coordinated small teams and supported quality checks; limited formal supervisory scope.",
      facets: {
        matchingSkills: ["Quality control", "Production planning"],
        gap: "Team-leadership scale below the 20+ requirement",
      },
      gates: [
        {
          order: 1,
          score: 2.6,
          daysAgo: 3,
          headline: "Below the leadership-scale bar for this role.",
          reasoning:
            "Some quality and line-coordination experience, but supervisory scope is small and there is no HVAC/ductwork background. Against the essential leadership and sector requirements this falls short — an AI Fail.",
          rawInput: "…coordinated a small line team and supported quality checks…",
        },
      ],
    },
    {
      id: "cand_daniel_costa",
      name: "Daniel Costa",
      headline: "Production Supervisor · HVAC",
      source: "Referral",
      stage: "applicant",
      status: "pending_review",
      currentGate: 3,
      resumeText:
        "Production Supervisor with 7 years in HVAC manufacturing. Owned shift planning and HSE for 45 operators; strong on output, developing on lean.",
      facets: {
        matchingSkills: ["HVAC/ductwork manufacturing", "Production planning", "Health & safety (HSE)"],
        gap: "Lean/continuous-improvement track record is thin",
      },
      gates: [
        {
          order: 1,
          score: 4.3,
          daysAgo: 5,
          headline: "Strong HVAC supervisor with solid HSE ownership.",
          reasoning:
            "Direct HVAC manufacturing supervision of 45 operators with HSE ownership — strong essential coverage. Lean/continuous-improvement is the softer area.",
          rawInput: "…owned shift planning and HSE for 45 operators in HVAC manufacturing…",
        },
        {
          order: 2,
          score: 83,
          daysAgo: 3,
          headline: "Aptitude & safety test: 83% — clears the bar.",
          reasoning: "Imported result. Safety module strong; numerical steady. Above the 80% threshold.",
          rawInput: "Imported — SHL Safety & Aptitude: 83%.",
        },
        {
          order: 3,
          score: 3.0,
          daysAgo: 1,
          headline: "Operations interview: solid ops, thin on people-management scenarios.",
          reasoning:
            "Confident on production planning and safety, but responses on handling underperformance and conflict were generic. Scored 3.0 (Borderline) — routed for a human decision.",
          rawInput: "Interview transcript excerpt: 'For output I set hourly targets… for a difficult operator, I'd talk to them.'",
        },
      ],
    },
    {
      id: "cand_mateo_reyes",
      name: "Mateo Reyes",
      headline: "Manufacturing Supervisor · MEP",
      source: "LinkedIn",
      stage: "applicant",
      status: "active",
      currentGate: 2,
      resumeText:
        "Manufacturing Supervisor with 6 years in MEP fabrication. Led 35 operators, drove lean improvements, and maintained quality standards.",
      facets: {
        matchingSkills: ["Team leadership", "Lean manufacturing", "Quality control"],
        gap: "HVAC/ductwork is adjacent MEP, not identical",
      },
      gates: [
        {
          order: 1,
          score: 4.1,
          daysAgo: 4,
          headline: "Capable lean-focused supervisor from adjacent MEP.",
          reasoning:
            "Led 35 operators with genuine lean improvements and quality discipline in MEP fabrication — a strong adjacent match. Direct ductwork is the gap. A clean pass.",
          rawInput: "…led 35 operators and drove lean improvements in MEP fabrication…",
        },
        {
          order: 2,
          score: 86,
          daysAgo: 2,
          headline: "Aptitude & safety test: 86% — comfortably clears.",
          reasoning: "Imported result. Balanced sub-scores, well above threshold.",
          rawInput: "Imported — SHL Safety & Aptitude: 86%.",
        },
      ],
    },
  ],
);

// ---- Sales Executive (on hold, no candidates yet) --------------------------
const salesJD: StructuredJD = {
  id: "jd_sales_executive_prime_ac",
  jobRole: {
    role: "Sales Executive",
    company: COMPANY,
    industry: ["HVAC", "manufacturing", "construction"],
    responsibilities: [
      "Develop new business across HVAC contractors and consultants",
      "Manage the full sales cycle from enquiry to close",
      "Prepare quotations and negotiate commercial terms",
      "Maintain the CRM and forecast the pipeline",
    ],
    skills: [
      { skill: "B2B sales", priority: "essential", proficiency_level: null },
      { skill: "HVAC/construction market knowledge", priority: "essential", proficiency_level: null },
      { skill: "Negotiation", priority: "essential", proficiency_level: null },
      { skill: "CRM (Salesforce/Zoho)", priority: "important", proficiency_level: null },
      { skill: "UAE driving licence", priority: "important", proficiency_level: null },
    ],
    experience: { level: "mid", years_total: { min: 3, max: 6 } },
    location: { cities: ["Dubai"], countries: ["United Arab Emirates"], remote_options: "hybrid" },
    employment_details: { type: "full_time" },
  },
  frozen: true,
  fieldSources: {},
  createdAt: iso(15),
  frozenAt: iso(12),
};

const salesPosition: Position = {
  id: salesJD.id,
  jd: salesJD,
  gateDefinitions: makeGateDefinitions(salesJD.id, [
    "Pre-screen",
    "Aptitude Test",
    "Sales Interview",
    "Roleplay Assessment",
    "Sales-Manager Interview",
    "Director Interview",
  ]),
  department: "Commercial",
  location: "Dubai, UAE",
  status: "on_hold",
  openedDaysAgo: 12,
};

// ---------------------------------------------------------------------------
// Flagship HR position + assembled exports
// ---------------------------------------------------------------------------
const hrPosition: Position = {
  id: JD_ID,
  jd: hrJD,
  gateDefinitions: hrGateDefinitions,
  department: "People & Culture",
  location: "Dubai, UAE",
  status: "open",
  openedDaysAgo: 21,
};

export const positions: Position[] = [
  hrPosition,
  accountant.position,
  production.position,
  salesPosition,
];

export const allCandidates: Candidate[] = [
  ...seedCandidates,
  ...extraHrCandidates,
  ...accountant.candidates,
  ...production.candidates,
];

export const allGateResults: GateResult[] = [
  ...seedGateResults,
  ...extraHrResults,
  ...accountant.results,
  ...production.results,
];

export const allFacets: Record<string, CandidateFacets> = {
  ...candidateFacets,
  ...extraHrFacets,
  ...accountant.facets,
  ...production.facets,
};
