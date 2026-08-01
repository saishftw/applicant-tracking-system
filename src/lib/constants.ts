// Stable demo-wide constants. DEMO_NOW anchors all relative time formatting so
// the narrative reads the same whenever the demo is run.
export const DEMO_NOW = new Date("2026-08-01T09:00:00.000Z");

export const PRODUCT_NAME = "Contra6 Recruit";
export const COMPANY_NAME = "Prime Focus Group (Prime AC)";
export const RECRUITER_NAME = "Aisha Rahman";
export const EVALUATOR_VERSION = "eval_v4.2.1";
export const JD_ID = "jd_hr_assistant_prime_ac";
export const TOTAL_GATES = 6;

// Live demo actions are timestamped just after DEMO_NOW (monotonic) so relative
// times read "just now" and stay stable no matter when the demo is run.
let tick = 0;
export function demoNowIso(): string {
  tick += 1;
  return new Date(DEMO_NOW.getTime() + tick * 60_000).toISOString();
}
