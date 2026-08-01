import { z } from "zod";

// ---------------------------------------------------------------------------
// JD literals — values mirror JobRoleSchema.py so the extracted JD JSON
// (hr_assistant_prime_ac.json) parses directly. Keep in sync with the Python contract.
// ---------------------------------------------------------------------------

export const ImportanceLevel = z.enum(["essential", "important", "valuable"]);
export type ImportanceLevel = z.infer<typeof ImportanceLevel>;

export const ProficiencyLevel = z.enum(["beginner", "intermediate", "advanced", "expert"]);
export type ProficiencyLevel = z.infer<typeof ProficiencyLevel>;

export const LanguageLevel = z.enum(["basic", "conversational", "professional", "native", "fluent"]);
export type LanguageLevel = z.infer<typeof LanguageLevel>;

export const SeniorityLevel = z.enum(["entry", "mid", "senior", "executive", "c_level"]);
export type SeniorityLevel = z.infer<typeof SeniorityLevel>;

export const RemoteOption = z.enum(["remote", "hybrid", "on_site", "flexible"]);
export type RemoteOption = z.infer<typeof RemoteOption>;

export const EmploymentType = z.enum(["full_time", "part_time", "contract", "contract_to_hire", "internship"]);
export type EmploymentType = z.infer<typeof EmploymentType>;

export const UrgencyLevel = z.enum(["immediate", "within_30_days", "within_60_days", "flexible"]);
export type UrgencyLevel = z.infer<typeof UrgencyLevel>;

export const PayFrequency = z.enum(["hourly", "annually", "monthly"]);
export type PayFrequency = z.infer<typeof PayFrequency>;

export const CompanySize = z.enum(["startup", "small", "medium", "large", "enterprise"]);
export type CompanySize = z.infer<typeof CompanySize>;

export const CompanyStage = z.enum(["early_stage", "growth", "mature", "public"]);
export type CompanyStage = z.infer<typeof CompanyStage>;

export const EnvironmentType = z.enum(["cloud", "on_premise", "hybrid"]);
export type EnvironmentType = z.infer<typeof EnvironmentType>;

// ---------------------------------------------------------------------------
// Contra6 Recruit pipeline enums — see CONTEXT.md for definitions.
// ---------------------------------------------------------------------------

/** The three gate modalities (ADR 0002, CONTEXT: GateDefinition). */
export const GateType = z.enum(["resume_match", "interview_eval", "test_import"]);
export type GateType = z.infer<typeof GateType>;

/** Canonical gate outcome that drives transitions (CONTEXT: Outcome). */
export const Outcome = z.enum(["pass", "fail", "borderline"]);
export type Outcome = z.infer<typeof Outcome>;

/** A human can only settle a result to pass or fail — never "borderline". */
export const HumanOutcome = z.enum(["pass", "fail"]);
export type HumanOutcome = z.infer<typeof HumanOutcome>;

/** Native unit a gate's Score is expressed in (ADR 0002). */
export const ScoreUnit = z.enum(["rubric_1_5", "percentage"]);
export type ScoreUnit = z.infer<typeof ScoreUnit>;

/** Sourced Prospect vs opted-in Applicant (CONTEXT: Candidate lifecycle). */
export const CandidateStage = z.enum(["prospect", "applicant"]);
export type CandidateStage = z.infer<typeof CandidateStage>;

/** Candidate disposition (CONTEXT: Parked, Pending Review, Lapsed, etc.). */
export const CandidateStatus = z.enum([
  "active",         // at a gate, awaiting evaluation or decision
  "pending_review", // current gate returned Borderline; awaiting a human decision
  "parked",         // held for later — the "up" swipe / maybe
  "rejected",       // failed a gate or swiped left; terminal unless overridden
  "hired",          // cleared all gates + conditional offer
  "lapsed",         // Prospect never responded to outreach (out of scope to capture)
  "withdrawn",      // candidate voluntarily dropped out
]);
export type CandidateStatus = z.infer<typeof CandidateStatus>;

/** Resolve a Borderline vs Override a clear outcome (ADR 0003). */
export const HumanDecisionKind = z.enum(["resolve", "override"]);
export type HumanDecisionKind = z.infer<typeof HumanDecisionKind>;

/** Per-field JD provenance (CONTEXT: Structured JD). */
export const FieldSource = z.enum(["llm", "human_edited"]);
export type FieldSource = z.infer<typeof FieldSource>;

/** When a CommsDraft is generated (CONTEXT: CommsDraft). */
export const CommsTrigger = z.enum(["outreach", "rejection", "offer"]);
export type CommsTrigger = z.infer<typeof CommsTrigger>;

/** LLM-drafted → recruiter-approved → simulated send (H1). */
export const CommsStatus = z.enum(["draft", "approved", "sent"]);
export type CommsStatus = z.infer<typeof CommsStatus>;

/** Terminal states that trigger a Composite Summary (F1). */
export const TerminalState = z.enum(["hired", "rejected"]);
export type TerminalState = z.infer<typeof TerminalState>;
