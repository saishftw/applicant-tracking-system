# Contra6 Recruit — UX Plan

Single-page app, dummy data, telling a two-act story: **Part 1 — own the ranking** → **Part 2 — gated progression**. Companion to [CONTEXT.md](../CONTEXT.md) (domain language) and [the ADRs](adr).

## Screens & navigation

**5 core screens + 2 overlays.**

### Core screens
1. **JD Setup** *(Part 1 entry)* — paste raw JD → AI-extracted Structured JD as an editable card (skill chips with priority, responsibilities, experience) → tune once → **Freeze & Score**.
2. **Shortlist** *(Part 1)* — the ranked candidates for the frozen JD; each row shows AI score (1–5, mono) + headline + top-3 matching skills + top gap. Launch point for Swipe.
3. **Swipe** *(Part 1)* — focused, one-card-at-a-time review deck (right = advance, left = reject, up = park). The emotional centerpiece; full-screen mode.
4. **Pipeline** *(Part 2)* — a Kanban board: columns = Gate 1…6 → Offer → Hired, plus a Rejected rail. Cards = candidates showing their current gate's score chip + outcome.
5. **Candidate Profile** — the GateResult Timeline + Composite Summary + comms history.

### Overlays (not standalone screens)
- **Gate Review drawer** — slides in from a Pipeline card: the GateResult (score, reasoning, raw input) + Resolve/Override controls.
- **Comms Draft modal** — the LLM-drafted message, editable, Approve → "Sent."

### Navigation
- **Left rail** for free movement: JD Setup · Shortlist · Swipe · Pipeline.
- **Top "demo path" stepper**: `1 JD → 2 Shortlist → 3 Swipe → 4 Pipeline → 5 Profile` for a clean linear walkthrough.
- **Profiles** open contextually from any candidate card.
- **Top bar** pins the active JD (*HR Assistant — Prime AC*).

## Design system

**Direction:** modern, minimal, light, easy to read — adopting the reference screen's *visual language, not its layout*.

- **Base:** Vite + React + TypeScript + Tailwind + shadcn/ui (see ADR 0006).
- **Theme:** light — white canvas, slate-50/100 panels, soft 1px slate borders, generous whitespace, `rounded-xl` cards with subtle shadows.
- **Palette:**
  - Neutrals: slate (900 headings · 500 secondary · 400 labels).
  - **AI accent: indigo** — reserved for AI moments (scores, "AI" labels, primary actions). AI evaluation cards carry a 4px indigo left border.
  - **Outcomes (sacred triad):** green = Pass · red = Fail · amber = Borderline — soft pastel pill chips (100-level bg, colored text, optional leading dot). Used nowhere else.
- **Type:** Inter for UI; JetBrains Mono for scores, outcomes, evaluator version tags, and IDs (signals "model output").
- **Chips:** skill chips = indigo-50 bg / indigo-700 text; gap & outcome chips = pastel per semantic.
- **Buttons:** primary = solid indigo · reject = ghost red · neutral (Park) = white outline.
- **Section labels:** uppercase, letter-spaced, small, slate-400.

**Signature element — `ScoreLine` / AI evaluation card:** bold mono score + `/5` (slate-400) + outcome chip + one-line headline; the expanded card adds the fuller reasoning, an evaluator version tag (mono pill), and source-snippet evidence. Appears identically on shortlist rows, swipe cards, pipeline cards, the gate drawer, and the profile timeline.

## Layout principles

Pixel-level layout is tuned iteratively **during the build**, not up front. The guiding rules:

- **Use the full screen** — no narrow centered columns; make use of the width with multi-region layouts (list + detail + context, like the reference screen).
- **Important data first, CTAs anchored** — surface the key data prominently and anchor primary actions at the **top or bottom** of each screen, whichever fits.
- **Follow the reference screenshots** — light, minimal, card-based; ScoreLine + skill/gap chips; indigo AI accent; a right-side journey timeline; a detail drawer for review.

## Per-screen intent

What lives where; exact layout tuned during build.

- **JD Setup** — paste box → on extract, an editable Structured JD fills the main area with a rubric-weight preview alongside; primary CTA **Freeze & Score** anchored bottom.
- **Shortlist** — full-width ranked list of candidates (avatar · ScoreLine · matching skills · gap); sort/filter and **Start Swipe Review** at top.
- **Swipe** — full-screen focused card; **Reject / Park / Advance** anchored bottom; progress + keyboard hints.
- **Pipeline** — full-width Kanban across Gates 1–6 → Offer → Hired, plus a Rejected rail; cards show the current ScoreLine; clicking a card opens the Gate Review drawer.
- **Candidate Profile** — main area = GateResult Timeline + Composite Summary; right = context (status · JD · comms), echoing the reference's three-region detail.
- **Gate Review drawer** — right-side drawer: GateResult (score · reasoning · raw input) + Resolve/Override with reason; action CTAs at bottom.
- **Comms Draft modal** — centered dialog: editable drafted message; **Approve → Sent** at bottom.
