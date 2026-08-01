# Prior gate history feeds later gates as context only; no auto-reweighting; cross-candidate learning is out of scope

Each later gate's evaluator receives the full prior `GateResult` history for that candidate — AI outcome and reasoning plus any human decision and its reason — so it reasons over the complete arc, including where a recruiter diverged from the AI. This feed-forward is **context only**: it never retrains, reweights, or shifts a gate's thresholds. Scoring stays deterministic and auditable for the demo, and overrides live purely as visible context plus an immutable log.

The cross-candidate feedback loop in the architecture diagram (HIRED → retention → data warehouse, "refines model") is deliberately **out of scope** for the demo: a dummy-data demo has no real hiring outcomes to learn from. It is narrated as roadmap — the compounding moat — not built.
