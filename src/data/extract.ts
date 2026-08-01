import type { ImportanceLevel, JobRole, RemoteOption, SeniorityLevel } from "@/schema";

// Best-effort structured-JD extraction from pasted text. This simulates the LLM
// extraction step for the demo — heuristic, with safe fallbacks so it always
// returns a schema-valid JobRole.

interface SkillDef {
  match: string[];
  label: string;
}

const SKILL_DICT: SkillDef[] = [
  { match: ["uae labour law", "labour law", "labor law"], label: "UAE Labour Law knowledge" },
  { match: ["wps", "wage protection"], label: "WPS (Wage Protection System)" },
  { match: ["mohre"], label: "MOHRE processes" },
  { match: ["visa", "labour card", "labor card"], label: "Visa & labour-card processing" },
  { match: ["hris", "bayzat", "zenhr"], label: "HRIS management" },
  { match: ["payroll"], label: "Payroll administration" },
  { match: ["onboarding", "offboarding"], label: "Onboarding/offboarding" },
  { match: ["recruitment", "recruiting", "talent acquisition"], label: "Recruitment coordination" },
  { match: ["attendance", "leave tracking", "timekeeping"], label: "Attendance & leave tracking" },
  { match: ["records", "record keeping", "record-keeping", "filing"], label: "Records management" },
  { match: ["vat", "fta"], label: "UAE VAT & FTA compliance" },
  { match: ["reconcil", "general ledger", "ledger"], label: "General ledger & reconciliations" },
  { match: ["accounts payable", "accounts receivable", "ap/ar"], label: "Accounts payable/receivable" },
  { match: ["financial report", "management report"], label: "Financial reporting" },
  { match: ["tally", "sap", "erp", "quickbooks"], label: "ERP / accounting systems" },
  { match: ["budget"], label: "Budgeting & forecasting" },
  { match: ["audit"], label: "Audit support" },
  { match: ["excel", "spreadsheet"], label: "Microsoft Excel" },
  { match: ["microsoft office", "ms office"], label: "MS Office" },
  { match: ["production planning", "production"], label: "Production planning" },
  { match: ["quality control", "qa/qc", "quality assurance"], label: "Quality control" },
  { match: ["health and safety", "health & safety", "hse", "safety"], label: "Health & safety (HSE)" },
  { match: ["lean", "continuous improvement", "kaizen"], label: "Lean manufacturing" },
  { match: ["hvac", "ductwork", "sheet metal", "fabrication"], label: "HVAC/manufacturing" },
  { match: ["team lead", "team leadership", "supervisor", "supervis"], label: "Team leadership" },
  { match: ["crm", "salesforce", "zoho", "hubspot"], label: "CRM systems" },
  { match: ["negotiat"], label: "Negotiation" },
  { match: ["b2b", "business development", "sales"], label: "B2B sales" },
  { match: ["customer service", "client relations"], label: "Customer service" },
  { match: ["project management", "project coordination"], label: "Project coordination" },
  { match: ["scheduling", "calendar management"], label: "Scheduling" },
  { match: ["compliance", "regulatory"], label: "Compliance" },
  { match: ["procurement", "purchasing"], label: "Procurement" },
  { match: ["inventory", "stock control"], label: "Inventory management" },
  { match: ["logistics", "supply chain"], label: "Logistics" },
  { match: ["javascript", "typescript", "react", "node"], label: "JavaScript / React" },
  { match: ["python"], label: "Python" },
  { match: ["sql", "database"], label: "SQL / databases" },
  { match: ["marketing", "seo", "social media"], label: "Marketing" },
  { match: ["communication", "interpersonal"], label: "Communication" },
  { match: ["attention to detail", "detail-oriented", "detail oriented"], label: "Attention to detail" },
  { match: ["organiz", "organis", "multitask"], label: "Organization" },
  { match: ["confidential", "discretion"], label: "Confidentiality" },
  { match: ["arabic"], label: "Arabic language" },
  { match: ["driving licen", "driver's licen", "drivers licen"], label: "UAE driving licence" },
];

const GENERIC_FALLBACK = ["Communication", "Organization", "Attention to detail", "Microsoft Office"];

const BULLET_RE = /^[\s]*([-*•·–▪◦●o]|\d+[.)])\s+/;
const ROLE_HINT_RE =
  /(assistant|manager|executive|officer|coordinator|supervisor|engineer|accountant|analyst|specialist|administrator|technician|lead|director|consultant|representative|clerk|associate)/i;

function clean(s: string): string {
  return s.replace(/\s+/g, " ").replace(/[.:;,\-–]+$/, "").trim();
}

function extractRole(lines: string[], raw: string): string {
  const labelled = raw.match(/(?:job title|title|role|position|vacancy)\s*[:\-–]\s*(.+)/i);
  if (labelled?.[1]) return clean(labelled[1]).slice(0, 60);
  const titleLine = lines.find((l) => l.length <= 60 && ROLE_HINT_RE.test(l) && !BULLET_RE.test(l));
  if (titleLine) return clean(titleLine).slice(0, 60);
  const first = lines[0];
  return first ? clean(first).slice(0, 60) : "New Role";
}

function extractResponsibilities(lines: string[]): string[] {
  const bullets = lines
    .filter((l) => BULLET_RE.test(l))
    .map((l) => clean(l.replace(BULLET_RE, "")))
    .filter((l) => l.length > 12);
  if (bullets.length >= 2) return bullets.slice(0, 8);
  // fallback: sentences
  const sentences = lines
    .join(" ")
    .split(/(?<=[.!?])\s+/)
    .map(clean)
    .filter((s) => s.length > 30 && s.length < 200);
  const combined = [...bullets, ...sentences];
  return (combined.length ? combined : ["Support the day-to-day operations of the role."]).slice(0, 8);
}

function extractSkills(raw: string): JobRole["skills"] {
  const lower = raw.toLowerCase();
  const labels: string[] = [];
  for (const def of SKILL_DICT) {
    if (def.match.some((m) => lower.includes(m)) && !labels.includes(def.label)) {
      labels.push(def.label);
    }
  }
  for (const g of GENERIC_FALLBACK) {
    if (labels.length >= 4) break;
    if (!labels.includes(g)) labels.push(g);
  }
  return labels.slice(0, 12).map((skill, i): JobRole["skills"][number] => ({
    skill,
    priority: (i < 5 ? "essential" : i < 9 ? "important" : "valuable") as ImportanceLevel,
    proficiency_level: null,
  }));
}

function extractExperience(raw: string): JobRole["experience"] {
  const lower = raw.toLowerCase();
  let level: SeniorityLevel = "mid";
  if (/(senior|lead|principal)/.test(lower)) level = "senior";
  else if (/(junior|entry|graduate|assistant)/.test(lower)) level = "entry";
  else if (/(director|head of|vp|chief)/.test(lower)) level = "executive";
  const years = raw.match(/(\d+)\s*(?:\+|to|-|–)?\s*(\d+)?\s*years?/i);
  const min = years?.[1] ? parseInt(years[1], 10) : null;
  const max = years?.[2] ? parseInt(years[2], 10) : min != null ? min + 3 : null;
  return { level, years_total: { min, max } };
}

function extractLocation(raw: string): JobRole["location"] {
  const lower = raw.toLowerCase();
  const cities: string[] = [];
  for (const city of ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"]) {
    if (lower.includes(city.toLowerCase())) cities.push(city);
  }
  const remote = /remote/.test(lower)
    ? "remote"
    : /hybrid/.test(lower)
      ? "hybrid"
      : /on[- ]?site/.test(lower)
        ? "on_site"
        : "on_site";
  return {
    cities: cities.length ? cities : ["Dubai"],
    countries: ["United Arab Emirates"],
    remote_options: remote as RemoteOption,
  };
}

export function extractJobRole(text: string, companyName: string): JobRole {
  const raw = text.replace(/\r/g, "");
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return {
    role: extractRole(lines, raw),
    company: { name: companyName, size: "medium", stage: "mature" },
    responsibilities: extractResponsibilities(lines),
    skills: extractSkills(raw),
    experience: extractExperience(raw),
    location: extractLocation(raw),
    employment_details: { type: "full_time" },
  };
}

// A ready-to-paste sample so the demo can be run without a JD file handy.
export const SAMPLE_JD = `Job Title: Procurement Officer

Prime Focus Group (Prime AC) is hiring a Procurement Officer to support our Dubai manufacturing operation.

Key responsibilities:
- Source and negotiate with suppliers for raw materials and consumables
- Raise and track purchase orders and maintain procurement records
- Manage inventory levels and coordinate with stores and production
- Ensure compliance with company purchasing policy and budgets
- Support cost analysis and supplier performance reporting

Requirements:
- 3+ years procurement or purchasing experience, ideally in manufacturing
- Strong negotiation and supplier-management skills
- Proficiency in Microsoft Excel and ERP systems
- Attention to detail and strong organization
- Based in Dubai, on-site`;
