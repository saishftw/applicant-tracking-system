# Gate score and outcome are separate: native score per gate, unified Pass/Fail/Borderline

Each gate keeps a **native score** in its own unit — LLM-evaluated gates on a 1–5 rubric, imported test gates as a percentage — rather than normalizing everything onto one number as the original plan proposed ("score scale: 1-5" everywhere). A single canonical **outcome** — Pass / Fail / Borderline — is layered on top and is what drives candidate transitions and the uniform outcome chip across every gate.

This deviates from the plan deliberately: forcing an 85% logic test into "4/5" loses information and reads as odd to recruiters who know the test platforms, whereas a shared outcome vocabulary still delivers the "one scoring engine, many gate types" narrative and the consistent score-plus-reasoning card format. LLM gates use the 1–5 scale (**≥4 Pass, 3 Borderline, ≤2 Fail**); the diagram's ">5" thresholds are treated as loose shorthand and superseded here.
