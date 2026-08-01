import { deriveOutcome, type Candidate, type GateResult } from "@/schema";
import { DEMO_NOW, EVALUATOR_VERSION, JD_ID } from "@/lib/constants";
import { gateDefinitions } from "./seed";
import type { CandidateFacets } from "./seed";

// Additional sourced prospects for the HR Assistant role, to give the shortlist depth.
const g1 = gateDefinitions.find((d) => d.order === 1)!;

function iso(daysAgo: number): string {
  const d = new Date(DEMO_NOW);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(9, 0, 0, 0);
  return d.toISOString();
}

interface Spec {
  id: string;
  name: string;
  score: number;
  years: number;
  sector: string;
  source: string;
  matching: string[];
  gap: string;
  daysAgo: number;
}

const SPECS: Spec[] = [
  { id: "deepa_iyer", name: "Deepa Iyer", score: 4.7, years: 4, sector: "MEP contractor", source: "LinkedIn", matching: ["WPS (Wage Protection System)", "Visa and labour-card processes", "Bayzat HRIS"], gap: "No labour-camp management noted", daysAgo: 2 },
  { id: "rowena_santos", name: "Rowena Santos", score: 4.4, years: 4, sector: "HVAC manufacturer", source: "LinkedIn", matching: ["Payroll administration", "End-of-service/gratuity", "MOHRE contract registration"], gap: "HRIS was Excel-based, not a platform", daysAgo: 2 },
  { id: "hassan_malik", name: "Hassan Malik", score: 4.5, years: 3, sector: "facilities group", source: "Referral", matching: ["MOHRE contract registration", "Payroll administration", "HRIS management"], gap: "Recruitment coordination is light", daysAgo: 3 },
  { id: "joanna_cruz", name: "Joanna Cruz", score: 4.3, years: 5, sector: "trading company", source: "LinkedIn", matching: ["Recruitment coordination", "Onboarding/offboarding", "ZenHR"], gap: "WPS ownership was shared", daysAgo: 3 },
  { id: "ahmed_zaki", name: "Ahmed Zaki", score: 4.1, years: 2, sector: "manufacturing group", source: "LinkedIn", matching: ["UAE Labour Law knowledge", "Records management", "Attendance & leave tracking"], gap: "HRIS platform experience limited", daysAgo: 3 },
  { id: "ritu_kapoor", name: "Ritu Kapoor", score: 3.9, years: 3, sector: "retail group", source: "Agency", matching: ["Attendance & leave tracking", "Onboarding/offboarding", "Records management"], gap: "Payroll and WPS exposure is light", daysAgo: 4 },
  { id: "imran_sheikh", name: "Imran Sheikh", score: 3.7, years: 3, sector: "building-materials supplier", source: "LinkedIn", matching: ["Records management", "Attendance & leave tracking", "Onboarding/offboarding"], gap: "WPS was supported, not owned", daysAgo: 4 },
  { id: "samir_haddad", name: "Samir Haddad", score: 3.6, years: 2, sector: "contracting firm", source: "LinkedIn", matching: ["Visa and labour-card processes", "Government-portal experience"], gap: "HRIS and payroll depth unproven", daysAgo: 4 },
  { id: "nisha_pillai", name: "Nisha Pillai", score: 3.3, years: 2, sector: "SME", source: "Agency", matching: ["Records management", "Communication"], gap: "Core UAE HR operations not evidenced", daysAgo: 5 },
  { id: "faisal_khan", name: "Faisal Khan", score: 3.0, years: 3, sector: "logistics firm", source: "LinkedIn", matching: ["Government-portal experience", "Attendance & leave tracking"], gap: "HR-specific WPS and HRIS not shown", daysAgo: 5 },
  { id: "divya_menon", name: "Divya Menon", score: 2.8, years: 1, sector: "startup", source: "LinkedIn", matching: ["MS Office", "Organization"], gap: "Little hands-on UAE HR experience", daysAgo: 5 },
  { id: "tariq_aziz", name: "Tariq Aziz", score: 2.4, years: 4, sector: "IT services firm", source: "LinkedIn", matching: ["MS Office"], gap: "No UAE HR operations, WPS, or visa experience", daysAgo: 6 },
];

function headlineFor(score: number, m: string[]): string {
  const a = m[0] ?? "the essentials";
  const b = m[1] ?? "core skills";
  if (score >= 4.4) return `Strong HR operations match; ${a} and ${b} owned.`;
  if (score >= 4.0) return `Solid HR admin profile with good ${a} coverage.`;
  if (score >= 3.5) return `Capable HR generalist; ${a} strong, gaps elsewhere.`;
  if (score >= 3.0) return `Adjacent background; core ${a} depth unproven.`;
  return `Limited hands-on UAE HR operations experience.`;
}

function reasoningFor(score: number, m: string[], gap: string): string {
  const a = m[0] ?? "the essential skills";
  const b = m[1] ?? "related areas";
  if (score >= 4.0)
    return `Owns ${a} and ${b} for a comparable UAE workforce, mapping cleanly onto the essential criteria. ${gap} is the one watch-item, but this is a comfortable pass at pre-screen.`;
  if (score >= 3.0)
    return `Shows transferable strengths in ${a}, but does not fully evidence the essential HR operations at the depth the role needs. ${gap}. The score lands on the Borderline band for a human decision.`;
  return `Does not demonstrate the essential UAE HR operations such as WPS, visa processing, or HRIS. ${gap}. Against the weighted criteria this is a clear miss.`;
}

export const extraHrCandidates: Candidate[] = [];
export const extraHrResults: GateResult[] = [];
export const extraHrFacets: Record<string, CandidateFacets> = {};

for (const s of SPECS) {
  const id = `cand_${s.id}`;
  extraHrCandidates.push({
    id,
    jdId: JD_ID,
    name: s.name,
    headline: `HR Assistant · ${s.sector}`,
    location: "Dubai, UAE",
    avatarUrl: null,
    source: s.source,
    resumeText: `HR Assistant with ${s.years} year${s.years === 1 ? "" : "s"} at a Dubai ${s.sector}, covering ${s.matching
      .slice(0, 2)
      .map((x) => x.toLowerCase())
      .join(", ")} and day-to-day employee support.`,
    stage: "prospect",
    status: s.score >= 3 && s.score < 4 ? "pending_review" : "active",
    currentGate: 1,
    createdAt: iso(s.daysAgo),
  });
  extraHrFacets[id] = { matchingSkills: s.matching, gap: s.gap };
  extraHrResults.push({
    id: `res_${id}_g1`,
    candidateId: id,
    gateId: g1.id,
    gateOrder: 1,
    score: s.score,
    scoreUnit: "rubric_1_5",
    aiOutcome: deriveOutcome(s.score, g1),
    headline: headlineFor(s.score, s.matching),
    reasoning: reasoningFor(s.score, s.matching, s.gap),
    rawInput: `…profile summary matched against ${s.matching.slice(0, 2).join(" and ")} and related criteria…`,
    evaluatorVersion: EVALUATOR_VERSION,
    evaluatedAt: iso(s.daysAgo),
    jdId: JD_ID,
  });
}
