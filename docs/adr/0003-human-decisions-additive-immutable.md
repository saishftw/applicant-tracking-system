# Human decisions are additive and never mutate the AI outcome

Every `GateResult` stores the AI's score, reasoning, and outcome as **immutable** fields. A human decision — resolving a Borderline or overriding a clear Pass/Fail — is recorded as a separate, additive `humanDecision` (outcome + reason + actor + timestamp), never as an edit to the AI's fields. The **effective outcome** that drives candidate transitions is the human decision when present, otherwise the AI outcome; the card always shows both side by side.

Any outcome is overridable in either direction (Pass→Fail and Fail→Pass), not just Borderlines — the recruiter is always sovereign. Overriding a clear AI outcome requires a **mandatory reason**; resolving a Borderline does not. This costs more storage and UI than a single mutable outcome field, but it is what makes the audit trail trustworthy: a recruiter watching the demo can always see what the AI said and exactly how a human diverged from it.
