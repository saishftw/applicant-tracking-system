import { z } from "zod";
import { CandidateStage, CandidateStatus } from "./enums";

// ---------------------------------------------------------------------------
// Candidate — a sourced person under consideration for the single demo JD.
// "Candidate" is the umbrella; `stage` and `status` track the lifecycle
// (CONTEXT: Candidate / Prospect / Applicant). Scoped to one JD (E2 / backlog).
// ---------------------------------------------------------------------------

export const CandidateSchema = z.object({
  id: z.string(),
  jdId: z.string(),
  name: z.string(),
  headline: z.string().nullish(), // current title / role line
  location: z.string().nullish(),
  avatarUrl: z.string().nullish(),
  source: z.string().nullish(), // e.g. "LinkedIn"
  resumeText: z.string(), // the raw artifact Gate 1 scores against the JD

  stage: CandidateStage, // prospect | applicant
  status: CandidateStatus, // active | pending_review | parked | rejected | hired | lapsed | withdrawn
  currentGate: z.number().int().min(1).max(6).nullish(), // position in the pipeline (linear, one at a time)

  createdAt: z.string().datetime(),
});
export type Candidate = z.infer<typeof CandidateSchema>;
