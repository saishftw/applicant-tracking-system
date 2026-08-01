import { forwardRef, useCallback, useEffect, useRef } from "react";
import { ArrowRight, Bookmark, Columns3, X } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo, type Variants } from "motion/react";
import { type Candidate, type GateResult } from "@/schema";
import { useAppStore, type SwipeDir } from "@/store/useAppStore";
import { resultAtGate } from "@/lib/pipeline";
import { relativeTime } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { AIEvaluationCard } from "@/components/AIEvaluationCard";
import { MatchFacets } from "@/components/MatchFacets";
import { Button } from "@/components/ui/button";

type SwipeEntry = { candidate: Candidate; result: GateResult };
type DecisionSource = "drag" | "button" | "keyboard";
type PresenceContext = {
  direction: SwipeDir;
  source: DecisionSource;
  distance: number;
  reducedMotion: boolean;
};

const DECELERATION_RATE = 0.99;
const DRAG_HYSTERESIS = 10;
const COMMIT_DISTANCE = 112;

function project(velocity: number): number {
  return (velocity / 1000) * (DECELERATION_RATE / (1 - DECELERATION_RATE));
}

function projectedDecision(info: PanInfo): SwipeDir | null {
  if (Math.hypot(info.offset.x, info.offset.y) < DRAG_HYSTERESIS) return null;

  const projectedX = info.offset.x + project(info.velocity.x);
  const projectedY = info.offset.y + project(info.velocity.y);
  if (Math.abs(projectedX) >= COMMIT_DISTANCE && Math.abs(projectedX) >= Math.abs(projectedY)) {
    return projectedX > 0 ? "advance" : "reject";
  }
  if (projectedY <= -COMMIT_DISTANCE && Math.abs(projectedY) > Math.abs(projectedX)) return "park";
  return null;
}

const cardVariants: Variants = {
  initial: ({ reducedMotion, source }: PresenceContext) =>
    reducedMotion ? { opacity: 0 } : { opacity: 0, scale: source === "keyboard" ? 0.98 : 0.96 },
  center: ({ reducedMotion, source }: PresenceContext) => ({
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    rotate: 0,
    transition:
      reducedMotion
        ? { duration: 0.15, ease: "easeOut" }
        : source === "keyboard"
          ? { duration: 0.16, ease: "easeOut" }
          : { type: "spring", bounce: 0, duration: 0.32 },
  }),
  exit: ({ direction, source, distance, reducedMotion }: PresenceContext) => {
    if (reducedMotion) return { opacity: 0, transition: { duration: 0.15, ease: "easeOut" } };

    return {
      x: direction === "advance" ? distance : direction === "reject" ? -distance : 0,
      y: direction === "park" ? -distance : 0,
      rotate: direction === "advance" ? 7 : direction === "reject" ? -7 : 0,
      opacity: 0.45,
      transition: {
        ...(source === "keyboard"
          ? { duration: 0.18, ease: "easeIn" }
          : {
              type: "spring",
              bounce: source === "drag" ? 0.2 : 0,
              duration: source === "drag" ? 0.4 : 0.28,
            }),
      },
    };
  },
};

export function SwipeScreen() {
  const candidates = useAppStore((s) => s.candidates);
  const activePositionId = useAppStore((s) => s.activePositionId);
  const gateResults = useAppStore((s) => s.gateResults);
  const facets = useAppStore((s) => s.facets);
  const swipeDecisions = useAppStore((s) => s.swipeDecisions);
  const swipe = useAppStore((s) => s.swipe);
  const goTo = useAppStore((s) => s.goTo);

  const reducedMotion = useReducedMotion() ?? false;
  const presenceRef = useRef<Pick<PresenceContext, "direction" | "source">>({
    direction: "advance",
    source: "button",
  });

  const prospects = candidates
    .filter((c) => c.stage === "prospect" && c.jdId === activePositionId)
    .map((c) => ({ candidate: c, result: resultAtGate(gateResults, c.id, 1) }))
    .filter((r): r is { candidate: (typeof candidates)[number]; result: GateResult } => Boolean(r.result))
    .sort((a, b) => b.result.score - a.result.score);

  const deck = prospects.filter((r) => !swipeDecisions[r.candidate.id]);
  const total = prospects.length;
  const done = total - deck.length;
  const top = deck[0];

  const doSwipe = useCallback(
    (dir: SwipeDir, source: DecisionSource = "button") => {
      if (!top) return;
      presenceRef.current = { direction: dir, source };
      swipe(top.candidate.id, dir);
    },
    [top, swipe],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft") doSwipe("reject", "keyboard");
      else if (e.key === "ArrowRight") doSwipe("advance", "keyboard");
      else if (e.key === "ArrowUp") doSwipe("park", "keyboard");
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doSwipe]);

  const presence: PresenceContext = {
    ...presenceRef.current,
    distance: typeof window === "undefined" ? 1200 : Math.max(window.innerWidth, window.innerHeight),
    reducedMotion,
  };

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <p className="section-label">Swipe Review</p>
          <p className="text-sm text-slate-500">AI recommends, you decide. One candidate at a time.</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-slate-500">
            {Math.min(done + (top ? 1 : 0), total)} / {total}
          </span>
          <Button variant="secondary" onClick={() => goTo("shortlist")}>
            Back to Shortlist
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="relative mx-auto w-full max-w-2xl">
          {top && deck.length > 2 && (
            <div className="absolute inset-x-6 -top-3 h-16 rounded-xl border border-slate-200 bg-white/70" />
          )}
          {top && deck.length > 1 && (
            <div className="absolute inset-x-3 -top-1.5 h-16 rounded-xl border border-slate-200 bg-white/90" />
          )}

          <AnimatePresence initial={false} mode="popLayout" custom={presence}>
            {top && (
              <SwipeCard
                key={top.candidate.id}
                entry={top}
                facets={facets[top.candidate.id]}
                presence={presence}
                onDecision={(direction) => doSwipe(direction, "drag")}
              />
            )}
          </AnimatePresence>
        </div>

        {!top && (
          <DeckComplete
            total={total}
            decisions={prospects.map((p) => swipeDecisions[p.candidate.id])}
            onNext={() => goTo("candidates")}
          />
        )}
      </div>

      {top && (
        <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-3">
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="danger"
              size="lg"
              className="min-w-32 rounded-full"
              onClick={() => doSwipe("reject")}
            >
              <X className="size-4" /> Reject
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="min-w-32 rounded-full"
              onClick={() => doSwipe("park")}
            >
              <Bookmark className="size-4" /> Park
            </Button>
            <Button size="lg" className="min-w-32 rounded-full" onClick={() => doSwipe("advance")}>
              <ArrowRight className="size-4" /> Advance
            </Button>
          </div>
          <p className="mt-2 text-center font-mono text-xs text-slate-400">← Reject · ↑ Park · → Advance</p>
        </div>
      )}
    </div>
  );
}

const SwipeCard = forwardRef<HTMLDivElement, {
  entry: SwipeEntry;
  facets?: ReturnType<typeof useAppStore.getState>["facets"][string];
  presence: PresenceContext;
  onDecision: (direction: SwipeDir) => void;
}>(function SwipeCard({ entry, facets, presence, onDecision }, ref) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-240, 0, 240], [-7, 0, 7]);
  const rejectOpacity = useTransform(x, [-132, -28], [1, 0]);
  const advanceOpacity = useTransform(x, [28, 132], [0, 1]);
  const parkOpacity = useTransform(y, [-132, -28], [1, 0]);

  return (
    <motion.div
      ref={ref}
      custom={presence}
      variants={cardVariants}
      initial="initial"
      animate="center"
      exit="exit"
      drag
      dragDirectionLock
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={{ top: 1, right: 1, bottom: 0.2, left: 1 }}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        const direction = projectedDecision(info);
        if (direction) onDecision(direction);
      }}
      style={{ x, y, rotate, touchAction: "none" }}
      role="group"
      aria-label={`Review ${entry.candidate.name}`}
      className="relative cursor-grab select-none rounded-2xl border border-slate-200 bg-white p-6 shadow-lg active:cursor-grabbing"
    >
      <motion.div
        aria-hidden="true"
        style={{ opacity: rejectOpacity }}
        className="pointer-events-none absolute left-5 top-5 z-10 rounded-full border border-red-200 bg-white/95 px-3 py-1 text-xs font-semibold uppercase text-red-600 shadow-sm"
      >
        Reject
      </motion.div>
      <motion.div
        aria-hidden="true"
        style={{ opacity: parkOpacity }}
        className="pointer-events-none absolute left-1/2 top-5 z-10 -translate-x-1/2 rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-xs font-semibold uppercase text-slate-600 shadow-sm"
      >
        Park
      </motion.div>
      <motion.div
        aria-hidden="true"
        style={{ opacity: advanceOpacity }}
        className="pointer-events-none absolute right-5 top-5 z-10 rounded-full border border-indigo-200 bg-white/95 px-3 py-1 text-xs font-semibold uppercase text-indigo-600 shadow-sm"
      >
        Advance
      </motion.div>

      <div className="flex items-start gap-4">
        <Avatar name={entry.candidate.name} src={entry.candidate.avatarUrl} size="xl" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-slate-900">{entry.candidate.name}</h2>
          <p className="text-sm text-slate-500">{entry.candidate.headline}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {entry.candidate.location} · {entry.candidate.source} · Applied {relativeTime(entry.candidate.createdAt)}
          </p>
        </div>
      </div>

      <AIEvaluationCard result={entry.result} className="mt-5 shadow-none" />

      {facets && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <MatchFacets facets={facets} />
        </div>
      )}
    </motion.div>
  );
});
SwipeCard.displayName = "SwipeCard";

function DeckComplete({
  total,
  decisions,
  onNext,
}: {
  total: number;
  decisions: (SwipeDir | undefined)[];
  onNext: () => void;
}) {
  const count = (d: SwipeDir) => decisions.filter((x) => x === d).length;
  return (
    <div className="c6-rise w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <Columns3 className="size-6" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">Swipe review complete</h2>
      <p className="mt-1 text-sm text-slate-500">
        You reviewed {total} candidate{total === 1 ? "" : "s"}. Advanced prospects were sent outreach and moved into
        the pipeline.
      </p>
      <div className="mt-5 flex justify-center gap-2 text-xs">
        <span className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700">
          {count("advance")} advanced
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">{count("park")} parked</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">{count("reject")} rejected</span>
      </div>
      <Button className="mt-6 w-full" size="lg" onClick={onNext}>
        Go to Candidates →
      </Button>
    </div>
  );
}
