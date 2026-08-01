import { useState } from "react";
import { ArrowRight, ChevronRight, Loader2 } from "lucide-react";
import type { Candidate, GateResult } from "@/schema";
import { useAppStore } from "@/store/useAppStore";
import { currentResult, pipelineStage, type PipelineStage } from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Avatar } from "@/components/Avatar";
import { ScoreLine } from "@/components/ScoreLine";
import { StatusPill } from "@/components/StatusPill";
import { GateProgress } from "@/components/GateProgress";
import type { Position } from "@/data/positions";

type Bucket = "all" | "review" | "progress" | "offer" | "hired" | "rejected";

const FILTERS: { id: Bucket; label: string }[] = [
  { id: "all", label: "All" },
  { id: "review", label: "Needs review" },
  { id: "progress", label: "In progress" },
  { id: "offer", label: "Offer" },
  { id: "hired", label: "Hired" },
  { id: "rejected", label: "Rejected" },
];

// Only actionable "advance" states get a hint; StatusPill covers the rest.
const HINT: Partial<Record<PipelineStage, string>> = {
  awaiting: "Input needed",
  passed: "Ready to advance",
  passed_final: "Ready for offer",
};

function bucketOf(stage: PipelineStage): Bucket {
  if (stage === "rejected") return "rejected";
  if (stage === "hired") return "hired";
  if (stage === "offer") return "offer";
  if (stage === "borderline" || stage === "failed") return "review";
  return "progress";
}

export function CandidatesScreen() {
  const activePositionId = useAppStore((s) => s.activePositionId);
  const positions = useAppStore((s) => s.positions);
  const candidates = useAppStore((s) => s.candidates);
  const gateResults = useAppStore((s) => s.gateResults);
  const commsDrafts = useAppStore((s) => s.commsDrafts);
  const openProfile = useAppStore((s) => s.openProfile);
  const [filter, setFilter] = useState<Bucket>("all");

  const pos = positions.find((p) => p.id === activePositionId);
  if (!pos) return null;

  const offerIds = new Set(commsDrafts.filter((d) => d.trigger === "offer").map((d) => d.candidateId));
  const rows = candidates
    .filter((c) => c.jdId === pos.id && c.stage === "applicant")
    .map((c) => {
      const stage = pipelineStage(c, gateResults, offerIds.has(c.id));
      return { candidate: c, stage, bucket: bucketOf(stage), result: currentResult(c, gateResults) };
    });

  const sortOrder: PipelineStage[] = ["borderline", "failed", "awaiting", "passed_final", "passed", "offer", "parked", "hired", "rejected"];
  rows.sort((a, b) => sortOrder.indexOf(a.stage) - sortOrder.indexOf(b.stage));

  const countOf = (b: Bucket) => (b === "all" ? rows.length : rows.filter((r) => r.bucket === b).length);
  const visible = filter === "all" ? rows : rows.filter((r) => r.bucket === filter);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-5">
        <ScreenHeader
          title="Candidates"
          subtitle="Applicants moving through the gates, one at a time. The AI scores each gate; you decide every transition."
        />
        <div className="mt-4 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === f.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {f.label}
              <span className={cn("font-mono", filter === f.id ? "text-indigo-200" : "text-slate-400")}>
                {countOf(f.id)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto max-w-5xl">
          <div className="mb-2 hidden gap-4 px-4 lg:flex">
            <p className="section-label w-56 shrink-0">Candidate</p>
            <p className="section-label flex-1">Gate journey</p>
            <p className="section-label w-36 shrink-0">Current gate</p>
            <p className="section-label w-28 shrink-0">Status</p>
            <span className="w-4 shrink-0" />
          </div>

          <div className="space-y-2">
            {visible.map((row) => (
              <CandidateRow
                key={row.candidate.id}
                candidate={row.candidate}
                result={row.result}
                stage={row.stage}
                position={pos}
                onClick={() => openProfile(row.candidate.id)}
              />
            ))}
            {visible.length === 0 && <p className="py-16 text-center text-sm text-slate-400">No candidates in this view.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function CandidateRow({
  candidate,
  result,
  stage,
  position,
  onClick,
}: {
  candidate: Candidate;
  result?: GateResult;
  stage: PipelineStage;
  position: Position;
  onClick: () => void;
}) {
  const gateResults = useAppStore((s) => s.gateResults);
  const evaluatingId = useAppStore((s) => s.evaluatingCandidateId);
  const evaluating = evaluatingId === candidate.id;
  const hint = HINT[stage];
  const def = position.gateDefinitions.find((d) => d.order === candidate.currentGate);

  const journeyCaption =
    candidate.status === "hired"
      ? "Cleared all gates"
      : candidate.status === "rejected"
        ? `Stopped at Gate ${candidate.currentGate}`
        : def
          ? `Gate ${candidate.currentGate} · ${def.label}`
          : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md lg:flex-row lg:items-center lg:gap-4"
    >
      <div className="flex min-w-0 items-center gap-3 lg:w-56 lg:shrink-0">
        <Avatar name={candidate.name} src={candidate.avatarUrl} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{candidate.name}</p>
          <p className="truncate text-xs text-slate-500">{candidate.headline}</p>
        </div>
      </div>

      <div className="min-w-0 lg:flex-1">
        <GateProgress candidate={candidate} results={gateResults} gateDefinitions={position.gateDefinitions} />
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
          <span className="truncate text-slate-400">{journeyCaption}</span>
          {evaluating ? (
            <span className="inline-flex shrink-0 items-center gap-1 font-medium text-indigo-600">
              <Loader2 className="size-3 animate-spin" /> Evaluating…
            </span>
          ) : hint ? (
            <span className="inline-flex shrink-0 items-center gap-1 font-medium text-indigo-600">
              <ArrowRight className="size-3" /> {hint}
            </span>
          ) : null}
        </div>
      </div>

      <div className="lg:w-36 lg:shrink-0">
        {result ? (
          <ScoreLine result={result} size="sm" showHeadline={false} />
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </div>

      <div className="lg:w-28 lg:shrink-0">
        <StatusPill status={candidate.status} />
      </div>

      <ChevronRight className="hidden size-4 shrink-0 text-slate-300 lg:block" />
    </button>
  );
}
