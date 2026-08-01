import { z } from "zod";
import { CommsTrigger, CommsStatus, TerminalState } from "./enums";

// ---------------------------------------------------------------------------
// Comms & profile artifacts. See CONTEXT.md (CommsDraft, Composite Summary),
// H1 (one draft → approve → simulated-send pattern) and F1 (summary at terminal state).
// ---------------------------------------------------------------------------

/** An outbound candidate message: LLM-drafted → recruiter-approved → Sent (simulated). */
export const CommsDraftSchema = z.object({
  id: z.string(),
  candidateId: z.string(),
  trigger: CommsTrigger, // outreach | rejection | offer
  status: CommsStatus, // draft | approved | sent
  subject: z.string(),
  body: z.string(),
  draftedAt: z.string().datetime(),
  approvedAt: z.string().datetime().nullish(),
  sentAt: z.string().datetime().nullish(), // simulated; never actually delivered
});
export type CommsDraft = z.infer<typeof CommsDraftSchema>;

/** LLM narrative of a candidate's whole arc, generated at a terminal state (F1). */
export const CompositeSummarySchema = z.object({
  candidateId: z.string(),
  terminalState: TerminalState, // hired | rejected
  summary: z.string(),
  generatedAt: z.string().datetime(),
});
export type CompositeSummary = z.infer<typeof CompositeSummarySchema>;
