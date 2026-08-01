import { z } from "zod";
import { GateType, Outcome, HumanOutcome, ScoreUnit, HumanDecisionKind } from "./enums";

// ---------------------------------------------------------------------------
// Gates — the ordered, per-JD definitions and the per-candidate results.
// See CONTEXT.md (Gate, GateDefinition, GateResult, Human Decision) and
// ADR 0002 (native score + unified outcome) / ADR 0003 (additive human layer).
// ---------------------------------------------------------------------------

/** Per-JD, ordered specification of a gate. */
export const GateDefinitionSchema = z.object({
  id: z.string(),
  jdId: z.string(),
  order: z.number().int().min(1).max(6),
  type: GateType, // resume_match | interview_eval | test_import
  label: z.string(), // e.g. "Pre-screen", "HR interview", "Logic test"
  scoreUnit: ScoreUnit, // rubric_1_5 (LLM) | percentage (test)
  passThreshold: z.number(), // native unit: e.g. 4 (rubric) or 80 (%)
  /** Rubric gates only: scores in [borderlineFloor, passThreshold) are Borderline. */
  borderlineFloor: z.number().nullish(),
  /** Prompt / rubric context for LLM gates; the JD priorities weight resume_match. */
  promptContext: z.string().nullish(),
});
export type GateDefinition = z.infer<typeof GateDefinitionSchema>;

/**
 * A recruiter's judgment layered ON TOP of the AI outcome — never mutates it (ADR 0003).
 * `resolve` settles a Borderline; `override` contradicts a clear Pass/Fail and needs a reason.
 */
export const HumanDecisionSchema = z
  .object({
    kind: HumanDecisionKind,
    outcome: HumanOutcome, // pass | fail (a human never records "borderline")
    reason: z.string().nullish(), // mandatory for override, optional for resolve
    actor: z.string(),
    decidedAt: z.string().datetime(),
  })
  .refine((d) => d.kind === "resolve" || (d.reason?.trim().length ?? 0) > 0, {
    message: "Override requires a reason",
    path: ["reason"],
  });
export type HumanDecision = z.infer<typeof HumanDecisionSchema>;

/**
 * One row per candidate per gate. The AI fields are immutable; `humanDecision`
 * is additive. `rawInput` + `jdId` + `evaluatorVersion` make each result auditable.
 */
export const GateResultSchema = z.object({
  id: z.string(),
  candidateId: z.string(),
  gateId: z.string(),
  gateOrder: z.number().int().min(1).max(6),

  // --- immutable AI evaluation ---
  score: z.number(),
  scoreUnit: ScoreUnit,
  aiOutcome: Outcome,
  headline: z.string(), // one-line, mono
  reasoning: z.string(), // 2-3 sentences
  rawInput: z.string(), // resume snippet / transcript / imported score
  evaluatorVersion: z.string(), // e.g. "eval_v4.2.1"
  evaluatedAt: z.string().datetime(),
  jdId: z.string(), // the exact (frozen) JD context this saw

  // --- additive human layer ---
  humanDecision: HumanDecisionSchema.nullish(),
});
export type GateResult = z.infer<typeof GateResultSchema>;

/** Effective outcome = human decision if present, else the AI outcome (ADR 0003). */
export function effectiveOutcome(result: GateResult): Outcome {
  return result.humanDecision?.outcome ?? result.aiOutcome;
}

/**
 * Derive an outcome from a native score against a gate definition.
 * Rubric gates: >= passThreshold Pass, >= borderlineFloor Borderline, else Fail.
 * Test gates (no borderlineFloor): >= passThreshold Pass, else Fail.
 */
export function deriveOutcome(score: number, def: GateDefinition): Outcome {
  if (score >= def.passThreshold) return "pass";
  if (def.borderlineFloor != null && score >= def.borderlineFloor) return "borderline";
  return "fail";
}
