import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Bookmark, Columns3, X } from "lucide-react";
import { type GateResult } from "@/schema";
import { useAppStore, type SwipeDir } from "@/store/useAppStore";
import { resultAtGate } from "@/lib/pipeline";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/Avatar";
import { AIEvaluationCard } from "@/components/AIEvaluationCard";
import { MatchFacets } from "@/components/MatchFacets";
import { Button } from "@/components/ui/button";

const EXIT: Record<SwipeDir, string> = {
  reject: "-translate-x-[120%] -rotate-6 opacity-0",
  advance: "translate-x-[120%] rotate-6 opacity-0",
  park: "-translate-y-[120%] opacity-0",
};

export function SwipeScreen() {
  const candidates = useAppStore((s) => s.candidates);
  const activePositionId = useAppStore((s) => s.activePositionId);
  const gateResults = useAppStore((s) => s.gateResults);
  const facets = useAppStore((s) => s.facets);
  const swipeDecisions = useAppStore((s) => s.swipeDecisions);
  const swipe = useAppStore((s) => s.swipe);
  const goTo = useAppStore((s) => s.goTo);

  const [exiting, setExiting] = useState<SwipeDir | null>(null);

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
    (dir: SwipeDir) => {
      if (!top || exiting) return;
      const id = top.candidate.id;
      setExiting(dir);
      window.setTimeout(() => {
        swipe(id, dir);
        setExiting(null);
      }, 300);
    },
    [top, exiting, swipe],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") doSwipe("reject");
      else if (e.key === "ArrowRight") doSwipe("advance");
      else if (e.key === "ArrowUp") doSwipe("park");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doSwipe]);

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

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-6">
        {top ? (
          <>
            <div className="relative w-full max-w-2xl">
              {/* peeking ghosts for deck depth */}
              {deck.length > 2 && (
                <div className="absolute inset-x-6 -top-3 h-16 rounded-xl border border-slate-200 bg-white/70" />
              )}
              {deck.length > 1 && (
                <div className="absolute inset-x-3 -top-1.5 h-16 rounded-xl border border-slate-200 bg-white/90" />
              )}

              <div
                key={top.candidate.id}
                className={cn(
                  "c6-swipe-in relative rounded-2xl border border-slate-200 bg-white p-6 shadow-lg transition-all duration-300 ease-out",
                  exiting && EXIT[exiting],
                )}
              >
                <div className="flex items-start gap-4">
                  <Avatar name={top.candidate.name} src={top.candidate.avatarUrl} size="xl" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-semibold text-slate-900">{top.candidate.name}</h2>
                    <p className="text-sm text-slate-500">{top.candidate.headline}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {top.candidate.location} · {top.candidate.source} · Applied{" "}
                      {relativeTime(top.candidate.createdAt)}
                    </p>
                  </div>
                </div>

                <AIEvaluationCard result={top.result} className="mt-5 shadow-none" />

                {facets[top.candidate.id] && (
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <MatchFacets facets={facets[top.candidate.id]!} />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
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

            <p className="mt-4 font-mono text-xs text-slate-400">
              ← Reject · ↑ Park · → Advance
            </p>
          </>
        ) : (
          <DeckComplete
            total={total}
            decisions={prospects.map((p) => swipeDecisions[p.candidate.id])}
            onNext={() => goTo("candidates")}
          />
        )}
      </div>
    </div>
  );
}

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
