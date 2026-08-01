# Contra6 Recruit — Recruiting Pipeline

The AI-native recruiting pipeline for Prime Focus Group (Prime AC): JD → AI shortlist → human review → gated progression → hire. Contra6 owns the scoring and ranking (the moat); the ATS/tracking layer is rented. This demo simulates the whole flow as one system.

## Language

### Pipeline

**Gate**:
A pipeline stage that produces a machine evaluation (score + reasoning + outcome) and requires a human decision before a candidate can advance. Gates are ordered 1–6.
_Avoid_: stage, step, round, checkpoint

**GateDefinition**:
The per-JD, ordered specification of a gate: its type (`resume_match`, `interview_eval`, or `test_import`), a pass threshold in the gate's native unit, and prompt/rubric context. The rubric difference between interviews (HR vs dept-mgr vs GM) lives here, not in a separate type.
_Avoid_: gate config

**Shortlist**:
The ranked set of Gate 1 evaluations (resume vs JD) shown to a recruiter for review. It is Gate 1's output view, not a separate pre-Gate-1 step.
_Avoid_: longlist, candidate list

**Swipe**:
The recruiter's human decision on a Gate 1 shortlist entry — right = advance, left = reject, up = park. The high-throughput form of the human-decision layer that every gate has.

### JD & rubric

**Structured JD**:
The LLM-extracted representation of the job (skills with priority, technologies, experience, languages), tuned once by the recruiter at upload and then frozen. The source of truth for the Gate 1 rubric; conforms to JobRoleSchema. Each field is tagged `source: llm | human-edited`.
_Avoid_: parsed JD, job spec

**Rubric**:
The weighted scoring criteria a gate evaluates against. For Gate 1 it is derived from the Structured JD's skills and their priority tags — `essential` weighs most, then `important`, then `valuable`.
_Avoid_: criteria, scorecard

### Candidate lifecycle

**Candidate**:
The person under consideration for a role, tracked from sourcing through to hire or rejection. "Candidate" is the umbrella term; Prospect and Applicant are lifecycle states of a Candidate.
_Avoid_: lead

**Prospect**:
A Candidate who has been sourced and scored (Gate 1) but has not yet been contacted or opted in — a passive prospect. This is the entry state.
_Avoid_: sourced lead

**Applicant**:
A Candidate who has responded to outreach and opted into the process. Part 2 of the demo begins here; only Applicants proceed to Gate 2 onward.
_Avoid_: candidate (as a synonym — Applicant is a specific opted-in state)

**Outreach**:
The first contact with a Prospect after swipe-right — sending the JD by email or LinkedIn. Triggers a CommsDraft; capturing the Prospect's response is out of scope for the demo.
_Avoid_: contact

**Lapsed**:
A Prospect who never responded to outreach. A defined terminal state, distinct from a Gate "fail" — the Candidate was never assessed on merit. (Capturing this transition is out of scope for the demo.)

**Parked**:
An Applicant held for later — the "up" swipe / "maybe" decision. Not advancing and not rejected; awaiting a later call.
_Avoid_: on hold, maybe

**Pending Review**:
The status of an Applicant whose current gate returned a Borderline outcome, awaiting a human decision. This is the "AI recommends, human decides" moment.
_Avoid_: needs approval

### Scoring & outcomes

**Score**:
A gate's evaluation result in its native unit — a 1–5 rubric judgment for LLM-evaluated gates, a percentage for imported test gates. Shown with its reasoning; not normalized across gates.
_Avoid_: rating, grade

**Outcome**:
The canonical result of a gate — one of Pass / Fail / Borderline — derived from the Score against the gate's threshold. Uniform across every gate type; this is what drives a candidate's transition.
_Avoid_: result, verdict

**Borderline**:
The middle Outcome — the Score lands in the band between clear pass and clear fail — which routes the Applicant to Pending Review for a human decision.
_Avoid_: maybe, uncertain

### Human decisions

**Human Decision**:
A recruiter's recorded judgment on a gate result — either resolving a Borderline or overriding a clear outcome. Stored additively alongside the AI outcome, never replacing it.
_Avoid_: approval, sign-off

**Override**:
A Human Decision that contradicts a clear AI Pass or Fail (in either direction). Requires a mandatory reason.
_Avoid_: edit, correction

**Resolve**:
A Human Decision that settles a Borderline outcome into Pass or Fail. Reason optional.

**Effective Outcome**:
The outcome that actually drives a candidate's transition: the Human Decision if one exists, otherwise the AI Outcome.
_Avoid_: final outcome

### Evaluation

**GateResult**:
The record a gate produces for a candidate: score, outcome, one-line headline, 2-3 sentence reasoning, the raw input evaluated, timestamps, and an optional human decision. One row per candidate per gate.
_Avoid_: gate score, evaluation

**Evaluator**:
The component that produces a GateResult — an LLM for resume and interview gates, or a templated import handler for test gates. Same output shape regardless of type.
_Avoid_: grader

**Headline**:
The one-line summary of a GateResult shown on shortlist and gate cards (mono type), paired with the fuller reasoning on expand.
_Avoid_: title

**Candidate Arc**:
The full ordered history of a candidate's GateResults — AI outcomes, reasoning, and human decisions — passed as context into each later gate's evaluator so it reasons over the whole journey, not just its own round.
_Avoid_: candidate history

### Profile & audit

**Timeline**:
The candidate profile's ordered view of every GateResult — score, headline, reasoning, human decision, and raw artifact. The rendered form of the Candidate Arc.
_Avoid_: history, log

**Composite Summary**:
An LLM-generated narrative of a candidate's whole arc, produced when they reach a terminal state (Hired or Rejected). Shown on the profile; not generated while a candidate is in-progress.
_Avoid_: final summary

### Comms

**CommsDraft**:
An outbound candidate message — LLM-drafted, recruiter-approved (editable), then marked Sent (simulated; never actually delivered in the demo). Triggered at Outreach, Rejection, and Offer. Status: `draft | approved | sent`.
_Avoid_: email, notification
