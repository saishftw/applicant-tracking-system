import type { Candidate, GateResult } from "@/schema";
import { effectiveOutcome } from "@/schema";
import { TOTAL_GATES } from "./constants";

// Kanban columns: Gates 1–6 → Offer → Hired, with a separate Rejected rail (UX.md).
export type PipelineColumnId = 1 | 2 | 3 | 4 | 5 | 6 | "offer" | "hired";

export function candidateResults(results: GateResult[], candidateId: string): GateResult[] {
  return results
    .filter((r) => r.candidateId === candidateId)
    .sort((a, b) => a.gateOrder - b.gateOrder);
}

export function resultAtGate(
  results: GateResult[],
  candidateId: string,
  order: number,
): GateResult | undefined {
  return results.find((r) => r.candidateId === candidateId && r.gateOrder === order);
}

/** The GateResult that represents where the candidate stands right now. */
export function currentResult(candidate: Candidate, results: GateResult[]): GateResult | undefined {
  const rs = candidateResults(results, candidate.id);
  if (candidate.currentGate != null) {
    const atCurrent = rs.find((r) => r.gateOrder === candidate.currentGate);
    if (atCurrent) return atCurrent;
  }
  return rs[rs.length - 1];
}

export function passedAllGates(candidate: Candidate, results: GateResult[]): boolean {
  const passes = new Set(
    candidateResults(results, candidate.id)
      .filter((r) => effectiveOutcome(r) === "pass")
      .map((r) => r.gateOrder),
  );
  for (let g = 1; g <= TOTAL_GATES; g++) if (!passes.has(g)) return false;
  return true;
}

export type Placement = { kind: "column"; column: PipelineColumnId } | { kind: "rejected" };

/** Where an Applicant sits on the pipeline board. A candidate who cleared all
 *  six gates only moves to Offer once the conditional-offer draft exists. */
export function pipelinePlacement(
  candidate: Candidate,
  results: GateResult[],
  hasOfferDraft: boolean,
): Placement {
  if (candidate.status === "rejected") return { kind: "rejected" };
  if (candidate.status === "hired") return { kind: "column", column: "hired" };
  if (passedAllGates(candidate, results) && hasOfferDraft) return { kind: "column", column: "offer" };
  return { kind: "column", column: (candidate.currentGate ?? 1) as PipelineColumnId };
}

/** The actionable state of an Applicant at their current gate — drives the
 *  pipeline card treatment and the Gate Review drawer controls. */
export type PipelineStage =
  | "passed" // cleared current gate, ready to advance
  | "passed_final" // cleared Gate 6, ready for a conditional offer
  | "offer" // conditional offer drafted, awaiting hire/reject
  | "borderline" // Borderline outcome, awaiting a human Resolve
  | "failed" // clear Fail, awaiting confirm or Override
  | "hired"
  | "rejected"
  | "parked"
  | "awaiting"; // advanced into a gate that has not evaluated yet

export function pipelineStage(
  candidate: Candidate,
  results: GateResult[],
  hasOfferDraft: boolean,
): PipelineStage {
  if (candidate.status === "rejected") return "rejected";
  if (candidate.status === "hired") return "hired";
  if (candidate.status === "parked") return "parked";

  const order = candidate.currentGate ?? 1;
  const atCurrent = resultAtGate(results, candidate.id, order);
  if (!atCurrent) return "awaiting"; // advanced into a gate not yet evaluated

  const eff = effectiveOutcome(atCurrent);
  if (eff === "borderline") return "borderline";
  if (eff === "fail") return "failed";
  if (order >= 6) return hasOfferDraft ? "offer" : "passed_final";
  return "passed";
}
