import { cn } from "@/lib/utils";
import type { CandidateStatus } from "@/schema";

// Status pills stay in slate/indigo — the green/red/amber triad is reserved
// exclusively for gate Outcomes (UX.md). Only notable statuses render a pill.
const META: Partial<Record<CandidateStatus, { label: string; cls: string }>> = {
  pending_review: { label: "Needs Review", cls: "bg-indigo-50 text-indigo-700" },
  parked: { label: "Parked", cls: "bg-slate-100 text-slate-600" },
  hired: { label: "Hired", cls: "bg-indigo-600 text-white" },
  rejected: { label: "Rejected", cls: "bg-slate-200 text-slate-500" },
};

export function StatusPill({
  status,
  className,
}: {
  status: CandidateStatus;
  className?: string;
}) {
  const m = META[status];
  if (!m) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium",
        m.cls,
        className,
      )}
    >
      {m.label}
    </span>
  );
}
