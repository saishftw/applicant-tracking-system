import type { ReactNode } from "react";
import type { Candidate, GateResult } from "@/schema";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { ScoreLine } from "./ScoreLine";
import { StatusPill } from "./StatusPill";

/** Compact candidate card for the pipeline Kanban and rejected rail. */
export function CandidateCard({
  candidate,
  result,
  onClick,
  dimmed = false,
  footer,
  className,
}: {
  candidate: Candidate;
  result?: GateResult;
  onClick?: () => void;
  dimmed?: boolean;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        dimmed && "opacity-60",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <Avatar name={candidate.name} src={candidate.avatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{candidate.name}</p>
          <p className="truncate text-xs text-slate-500">{candidate.headline}</p>
        </div>
        <StatusPill status={candidate.status} />
      </div>
      {result && (
        <div className="mt-3 space-y-1.5">
          <ScoreLine result={result} size="sm" showHeadline={false} />
          <p className="line-clamp-2 font-mono text-xs leading-snug text-slate-500">{result.headline}</p>
        </div>
      )}
      {footer}
    </button>
  );
}
