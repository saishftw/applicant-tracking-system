import { create } from "zustand";
import {
  effectiveOutcome,
  type Candidate,
  type CandidateStatus,
  type CommsDraft,
  type CompositeSummary,
  type GateResult,
  type HumanOutcome,
  type JobRole,
  type StructuredJD,
} from "@/schema";
import {
  positions as seedPositions,
  allCandidates,
  allGateResults,
  allFacets,
  makeGateDefinitions,
  DEFAULT_GATE_LABELS,
  type Position,
} from "@/data/positions";
import { seedCommsDrafts, seedCompositeSummaries, type CandidateFacets } from "@/data/seed";
import { buildInterviewResult, buildTestResult, draftComms, generateCompositeSummary, interviewScore } from "@/data/evaluations";
import { generateSourcedCandidates } from "@/data/evaluations-sourcing";
import { RECRUITER_NAME, demoNowIso } from "@/lib/constants";
import { resultAtGate } from "@/lib/pipeline";

export type Screen = "dashboard" | "jd" | "shortlist" | "swipe" | "candidates" | "profile";
export type SwipeDir = "advance" | "reject" | "park";
export type ToastTone = "info" | "success" | "warn" | "ai";
export type Toast = { id: number; message: string; tone: ToastTone };

function patchById<T extends { id: string }>(arr: T[], id: string, patch: Partial<T>): T[] {
  return arr.map((x) => (x.id === id ? { ...x, ...patch } : x));
}

function hasOfferDraft(drafts: CommsDraft[], candidateId: string): boolean {
  return drafts.some((d) => d.candidateId === candidateId && d.trigger === "offer");
}

interface AppState {
  // domain data
  positions: Position[];
  candidates: Candidate[];
  gateResults: GateResult[];
  commsDrafts: CommsDraft[];
  compositeSummaries: CompositeSummary[];
  facets: Record<string, CandidateFacets>;

  // ui / navigation
  activePositionId: string | null;
  activeScreen: Screen;
  selectedCandidateId: string | null;
  commsDraftId: string | null;
  evaluatingCandidateId: string | null;
  sourcingPositionId: string | null;
  swipeDecisions: Record<string, SwipeDir>;
  toast: Toast | null;

  // navigation
  goHome: () => void;
  selectPosition: (id: string) => void;
  createPosition: (jobRole: JobRole, department: string) => void;
  sourceCandidates: () => void;
  goTo: (s: Screen) => void;
  openProfile: (id: string) => void;
  openComms: (id: string) => void;
  closeComms: () => void;
  toastMsg: (message: string, tone?: ToastTone) => void;
  clearToast: () => void;

  // JD editing (blocked once the role is frozen)
  updateJd: (mutator: (jobRole: JobRole) => void) => void;
  addSkill: (skill: string) => void;
  freezeJD: () => void;

  // Part 1 swipe
  swipe: (id: string, dir: SwipeDir) => void;
  unpark: (id: string) => void;
  convertToApplicant: (id: string) => void;

  // gate progression
  advanceCandidate: (id: string) => void;
  importTestResult: (id: string, order: number, pct: number) => void;
  evaluateTranscript: (id: string, order: number, transcript: string) => void;
  resolveGate: (id: string, order: number, outcome: HumanOutcome, reason?: string) => void;
  overrideGate: (id: string, order: number, outcome: HumanOutcome, reason: string) => void;
  markHired: (id: string) => void;
  rejectCandidate: (id: string) => void;

  // comms
  approveComms: (id: string, subject: string, body: string) => void;
  sendComms: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => {
  const activePos = () => get().positions.find((p) => p.id === get().activePositionId);
  const posOf = (candidate: Candidate) => get().positions.find((p) => p.id === candidate.jdId);

  return {
    positions: seedPositions,
    candidates: allCandidates,
    gateResults: allGateResults,
    commsDrafts: seedCommsDrafts,
    compositeSummaries: seedCompositeSummaries,
    facets: allFacets,

    activePositionId: null,
    activeScreen: "dashboard",
    selectedCandidateId: null,
    commsDraftId: null,
    evaluatingCandidateId: null,
    sourcingPositionId: null,
    swipeDecisions: {},
    toast: null,

    goHome: () => set({ activeScreen: "dashboard", activePositionId: null, selectedCandidateId: null }),
    selectPosition: (id) => {
      const pos = get().positions.find((p) => p.id === id);
      if (!pos) return;
      set({
        activePositionId: id,
        activeScreen: pos.jd.frozen ? "shortlist" : "jd",
        selectedCandidateId: null,
      });
    },
    createPosition: (jobRole, department) => {
      const slug =
        jobRole.role.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 32) || "role";
      const id = `jd_${slug}_${Date.now().toString(36)}`;
      const jd: StructuredJD = { id, jobRole, frozen: false, fieldSources: {}, createdAt: demoNowIso(), frozenAt: null };
      const position: Position = {
        id,
        jd,
        gateDefinitions: makeGateDefinitions(id, DEFAULT_GATE_LABELS),
        department: department.trim() || "General",
        location: jobRole.location?.cities?.[0] ? `${jobRole.location.cities[0]}, UAE` : "Dubai, UAE",
        status: "open",
        openedDaysAgo: 0,
      };
      set({ positions: [...get().positions, position], activePositionId: id, activeScreen: "jd", selectedCandidateId: null });
      get().toastMsg(`Created “${jobRole.role}”. Review the criteria, then freeze to score.`, "success");
    },
    sourceCandidates: () => {
      const pos = activePos();
      if (!pos) return;
      if (get().candidates.some((c) => c.jdId === pos.id && c.stage === "prospect")) return;
      set({ sourcingPositionId: pos.id });
      window.setTimeout(() => {
        const { candidates, results, facets } = generateSourcedCandidates(pos);
        set((state) => ({
          candidates: [...state.candidates, ...candidates],
          gateResults: [...state.gateResults, ...results],
          facets: { ...state.facets, ...facets },
          sourcingPositionId: null,
        }));
        get().toastMsg(`Sourced ${candidates.length} candidates and scored them against the role.`, "ai");
      }, 1900);
    },
    goTo: (s) => set({ activeScreen: s }),
    openProfile: (id) => set({ selectedCandidateId: id, activeScreen: "profile" }),
    openComms: (id) => set({ commsDraftId: id }),
    closeComms: () => set({ commsDraftId: null }),
    toastMsg: (message, tone = "info") => set({ toast: { id: Date.now(), message, tone } }),
    clearToast: () => set({ toast: null }),

    updateJd: (mutator) => {
      const pos = activePos();
      if (!pos) return;
      if (pos.jd.frozen) return get().toastMsg("This role is frozen. Editing is closed.", "warn");
      const jobRole = structuredClone(pos.jd.jobRole);
      mutator(jobRole);
      set({ positions: patchById(get().positions, pos.id, { jd: { ...pos.jd, jobRole } }) });
    },

    addSkill: (skill) => {
      const clean = skill.trim();
      if (!clean) return;
      get().updateJd((jr) => {
        jr.skills.push({ skill: clean, priority: "important", proficiency_level: null });
      });
    },

    freezeJD: () => {
      const pos = activePos();
      if (!pos || pos.jd.frozen) return;
      set({
        positions: patchById(get().positions, pos.id, {
          jd: { ...pos.jd, frozen: true, frozenAt: demoNowIso() },
        }),
        activeScreen: "shortlist",
      });
      get().toastMsg("Role frozen and scored. The shortlist is ready.", "success");
    },

    swipe: (id, dir) => {
      const { candidates, commsDrafts } = get();
      const cand = candidates.find((c) => c.id === id);
      if (!cand) return;
      set({ swipeDecisions: { ...get().swipeDecisions, [id]: dir } });

      if (dir === "reject") {
        set({ candidates: patchById(candidates, id, { status: "rejected" }) });
        get().toastMsg(`${cand.name} rejected.`, "warn");
      } else if (dir === "park") {
        set({ candidates: patchById(candidates, id, { status: "parked" }) });
        get().toastMsg(`${cand.name} parked for later.`, "info");
      } else {
        const jr = posOf(cand)?.jd.jobRole;
        if (jr && !commsDrafts.some((d) => d.candidateId === id && d.trigger === "outreach")) {
          set({ commsDrafts: [...commsDrafts, draftComms(cand, "outreach", jr)] });
        }
        set({ candidates: patchById(candidates, id, { stage: "applicant", status: "active", currentGate: 2 }) });
        get().toastMsg(`${cand.name} advanced. Outreach drafted, now in the pipeline at Gate 2.`, "ai");
      }
    },

    unpark: (id) => {
      const { candidates } = get();
      const cand = candidates.find((c) => c.id === id);
      if (!cand) return;
      set({ candidates: patchById(candidates, id, { status: "active" }) });
      get().toastMsg(`${cand.name} un-parked.`, "info");
    },

    convertToApplicant: (id) => {
      const { candidates } = get();
      const cand = candidates.find((c) => c.id === id);
      if (!cand || cand.stage === "applicant") return;
      set({ candidates: patchById(candidates, id, { stage: "applicant", status: "active", currentGate: 2 }) });
      get().toastMsg(`${cand.name} entered the pipeline at Gate 2.`, "info");
    },

    advanceCandidate: (id) => {
      const { candidates, gateResults, commsDrafts } = get();
      const cand = candidates.find((c) => c.id === id);
      if (!cand) return;
      const pos = posOf(cand);
      if (!pos) return;
      const order = cand.currentGate ?? 1;
      const atCurrent = resultAtGate(gateResults, id, order);
      if (!atCurrent || effectiveOutcome(atCurrent) !== "pass") return;

      if (order >= 6) {
        if (!hasOfferDraft(commsDrafts, id)) {
          set({ commsDrafts: [...commsDrafts, draftComms(cand, "offer", pos.jd.jobRole)] });
        }
        get().toastMsg(`${cand.name} cleared all gates. Conditional offer drafted.`, "success");
        return;
      }

      const nextOrder = order + 1;
      const def = pos.gateDefinitions.find((d) => d.order === nextOrder);
      if (!def) return;
      set({ candidates: patchById(candidates, id, { currentGate: nextOrder as Candidate["currentGate"], status: "active" }) });
      get().toastMsg(
        `Advanced to ${def.label}. ${def.type === "test_import" ? "Import the test result." : "Add the transcript to evaluate."}`,
        "info",
      );
    },

    importTestResult: (id, order, pct) => {
      const { candidates, gateResults } = get();
      const cand = candidates.find((c) => c.id === id);
      if (!cand) return;
      const def = posOf(cand)?.gateDefinitions.find((d) => d.order === order);
      if (!def || def.type !== "test_import") return;
      const clamped = Math.max(0, Math.min(100, Math.round(pct)));
      const result = buildTestResult(cand, def, clamped);
      set({
        gateResults: [...gateResults.filter((r) => !(r.candidateId === id && r.gateOrder === order)), result],
        candidates: patchById(candidates, id, { status: "active" }),
      });
      if (result.aiOutcome === "pass") get().toastMsg(`Imported ${clamped}%. ${def.label} passed.`, "ai");
      else get().toastMsg(`Imported ${clamped}%, below the pass mark. Your decision needed.`, "warn");
    },

    evaluateTranscript: (id, order, transcript) => {
      const { candidates } = get();
      const cand = candidates.find((c) => c.id === id);
      if (!cand) return;
      const def = posOf(cand)?.gateDefinitions.find((d) => d.order === order);
      if (!def || def.type !== "interview_eval") return;
      set({ evaluatingCandidateId: id });
      window.setTimeout(() => {
        const state = get();
        const fresh = state.candidates.find((c) => c.id === id);
        if (!fresh) return set({ evaluatingCandidateId: null });
        const score = transcript.trim().length < 40 ? 3.0 : interviewScore(id, order);
        const result = buildInterviewResult(fresh, def, score, transcript);
        const status: CandidateStatus = result.aiOutcome === "borderline" ? "pending_review" : "active";
        set({
          gateResults: [...state.gateResults.filter((r) => !(r.candidateId === id && r.gateOrder === order)), result],
          candidates: patchById(state.candidates, id, { status }),
          evaluatingCandidateId: null,
        });
        if (result.aiOutcome === "borderline") get().toastMsg(`${def.label} came back Borderline. Your decision needed.`, "warn");
        else get().toastMsg(`${def.label}: evaluation returned a Pass.`, "ai");
      }, 1100);
    },

    resolveGate: (id, order, outcome, reason) => {
      const { gateResults } = get();
      const res = gateResults.find((r) => r.candidateId === id && r.gateOrder === order);
      if (!res) return;
      set({
        gateResults: patchById(gateResults, res.id, {
          humanDecision: { kind: "resolve", outcome, reason, actor: RECRUITER_NAME, decidedAt: demoNowIso() },
        }),
      });
      get().toastMsg(`Borderline resolved to ${outcome === "pass" ? "Pass" : "Fail"}.`, "success");
      applyOutcomeTransition(get, set, id, order, outcome);
    },

    overrideGate: (id, order, outcome, reason) => {
      const { gateResults } = get();
      const res = gateResults.find((r) => r.candidateId === id && r.gateOrder === order);
      if (!res) return;
      set({
        gateResults: patchById(gateResults, res.id, {
          humanDecision: { kind: "override", outcome, reason, actor: RECRUITER_NAME, decidedAt: demoNowIso() },
        }),
      });
      get().toastMsg(`AI outcome overridden to ${outcome === "pass" ? "Pass" : "Fail"}.`, "success");
      applyOutcomeTransition(get, set, id, order, outcome);
    },

    markHired: (id) => {
      const { candidates, gateResults, compositeSummaries } = get();
      const cand = candidates.find((c) => c.id === id);
      if (!cand) return;
      set({ candidates: patchById(candidates, id, { status: "hired", currentGate: 6 }) });
      if (!compositeSummaries.some((s) => s.candidateId === id)) {
        set({ compositeSummaries: [...get().compositeSummaries, generateCompositeSummary(cand, gateResults, "hired")] });
      }
      get().toastMsg(`${cand.name} marked as hired.`, "success");
    },

    rejectCandidate: (id) => {
      const { candidates, gateResults, commsDrafts, compositeSummaries } = get();
      const cand = candidates.find((c) => c.id === id);
      if (!cand) return;
      const jr = posOf(cand)?.jd.jobRole;
      set({ candidates: patchById(candidates, id, { status: "rejected" }) });
      if (jr && !commsDrafts.some((d) => d.candidateId === id && d.trigger === "rejection")) {
        set({ commsDrafts: [...get().commsDrafts, draftComms(cand, "rejection", jr)] });
      }
      if (!compositeSummaries.some((s) => s.candidateId === id)) {
        set({ compositeSummaries: [...get().compositeSummaries, generateCompositeSummary(cand, gateResults, "rejected")] });
      }
      get().toastMsg(`${cand.name} rejected — rejection drafted.`, "warn");
    },

    approveComms: (id, subject, body) => {
      set({
        commsDrafts: patchById(get().commsDrafts, id, { status: "approved", subject, body, approvedAt: demoNowIso() }),
      });
      get().toastMsg("Message approved — ready to send.", "success");
    },

    sendComms: (id) => {
      set({
        commsDrafts: patchById(get().commsDrafts, id, { status: "sent", sentAt: demoNowIso() }),
        commsDraftId: null,
      });
      get().toastMsg("Message sent to the candidate.", "success");
    },
  };
});

/** Pass advances (and evaluates the next gate); Fail rejects. Aligns currentGate
 *  to the decided gate so an override on a past gate re-opens the arc from there. */
function applyOutcomeTransition(
  get: () => AppState,
  set: (partial: Partial<AppState>) => void,
  id: string,
  order: number,
  outcome: HumanOutcome,
) {
  if (outcome === "pass") {
    set({
      candidates: patchById(get().candidates, id, { status: "active", currentGate: clampGate(order) }),
    });
    get().advanceCandidate(id);
  } else {
    get().rejectCandidate(id);
  }
}

function clampGate(order: number): 1 | 2 | 3 | 4 | 5 | 6 {
  return Math.min(6, Math.max(1, order)) as 1 | 2 | 3 | 4 | 5 | 6;
}
