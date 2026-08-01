# Contra6 Recruit — Demo MVP Plan

**Goal:** a single-system demo (dummy data, no backend) showing AI-native recruiting end to end — JD structuring → AI shortlisting → human review → gated progression → hire — with an intelligence layer at every gate and a full audit trail per candidate.

**Positioning:** own the ranking, rent the tracking, claw back the outcome. This demo shows the "own the ranking" and "claw back the outcome" pieces working as one system, not bolted onto an existing ATS.

---

## 1. Data model

**JobRequisition**
- raw JD text
- structured fields (LLM-extracted, human-editable): title, must-have skills, nice-to-have skills, responsibilities, seniority, salary band
- each field tagged `source: llm | human-edited`
- `GateDefinition[]` — ordered, per-JD

**GateDefinition**
- type: `resume_match | transcript_eval | aptitude_import | interview_eval`
- pass threshold (on 1-5 scale)
- prompt template / context spec

**Candidate**
- profile, resume, source (e.g. LinkedIn), current gate, overall status

**GateResult** (one row per candidate per gate)
- `score`: 1-5
- `outcome`: `pass | fail | borderline`
- `reasoning`: LLM-generated, 2-3 sentences
- `raw_input`: transcript / test score / resume snippet
- `evaluated_at`, `evaluator_version`
- `override`: optional human override + reason, always visible alongside the AI result

**AuditTrail**
- every AI decision logged with the exact context it saw (JD version, prior gate history) — this is what makes the reasoning trustworthy to a recruiter watching the demo

---

## 2. Flow (maps to the 9 requirements)

1. **JD → structured**: paste text → LLM extracts JSON → rendered as editable card (skill chips, responsibility list)
2. **Recruiter edits**: inline edits on the structured card; re-running the rubric silently updates downstream scoring weights
3. **AI shortlist**: candidates arrive with a 1-5 score + short "why" — never a bare number
4. **Human screening (Tinder swipe)**: post-AI-shortlist review layer
   - Card: score, top 3 matching skills, top gap, resume snippet
   - Right = advance to Gate 1, Left = reject, Up = park/maybe
   - This is the "AI recommends, human decides" moment — keep it visually central
5. **Gate progression**: generic gate component reused across types
   - Upload artifact (transcript / test result / file)
   - LLM evaluator runs with JD + full prior gate history as context
   - Outputs score + reasoning + outcome (pass/fail/borderline)
   - Manual override always available, always logged
6. **External test import**: normalized into the same `GateResult` schema — no LLM needed, just structured entry
7. **Reused intelligence layer**: same evaluator pattern across gate types — worth surfacing in the demo narrative ("one scoring engine, many gate types")
8. **Candidate comms**: LLM-drafted email on gate pass/fail, recruiter-approved before "sending" (demo shows drafted state, not real delivery)
9. **Candidate profile**: timeline of every `GateResult` (score, reasoning, raw artifact) + a final LLM-generated composite summary once all gates clear

---

## 3. Gate pipeline (from the reference architecture)

Gate 1 Pre-screen (resume vs JD) → Gate 2 Logic test (imported score) → Gate 3 HR interview (transcript) → Gate 4 Functional test (imported score) → Gate 5 Dept-manager interview (transcript) → Gate 6 GM interview (transcript) → Conditional offer → Hired

Each transcript-based gate evaluates using: JD context + all prior `GateResult`s + the new transcript — so later gates are aware of the full candidate arc, not just their own round.

---

## 4. Design system

- **Base**: shadcn/ui + Tailwind
- **Palette**: deep navy/slate structure, single accent (muted teal or indigo) reserved for "AI-scored" moments, clear green/red pass-fail pair, amber for borderline
- **Type**: clean grotesk (Inter) for UI; monospace for scores, reasoning, and IDs — signals "this is model output," not decorative copy
- **Signature element**: score + one-line reasoning, always paired, always in the mono face, consistent across shortlist / gate cards / profile timeline — this consistency is what makes it read as one system

---

## 5. Key decisions locked in

| Decision | Choice |
|---|---|
| Score scale | 1-5 |
| Gate outcome model | Pass / Fail / Borderline (human review) |
| Dummy data realism | Rich — genuinely varied resumes/transcripts, ~8-10 candidates, not filler text |
| Schema ownership | Left to build (not hand-specified), aligned to this plan |

---

## 6. Open for next pass

- Gate-evaluator prompt design: exact context window per gate type, reasoning format/length, confidence signal (if any)
- Whether overrides feed back into future scoring or stay purely a log
- Candidate reuse across multiple JDs (same person, different req)
