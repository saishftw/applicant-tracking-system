import { useState } from "react";
import { ArrowRight, Building2, MapPin, Plus, UserCheck, Users } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NewRequisitionModal } from "@/overlays/NewRequisitionModal";
import type { Position } from "@/data/positions";

export function DashboardScreen() {
  const positions = useAppStore((s) => s.positions);
  const candidates = useAppStore((s) => s.candidates);
  const selectPosition = useAppStore((s) => s.selectPosition);
  const [open, setOpen] = useState(false);

  const openRoles = positions.filter((p) => p.status === "open").length;
  const totalCandidates = candidates.length;
  const needsReview = candidates.filter((c) => c.status === "pending_review").length;
  const hires = candidates.filter((c) => c.status === "hired").length;

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Requisitions</h1>
              <p className="mt-1 text-sm text-slate-500">
                Open roles at Prime Focus Group (Prime AC). Select a role to review and progress its candidates.
              </p>
            </div>
            <Button size="lg" onClick={() => setOpen(true)}>
              <Plus className="size-4" /> New requisition
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <SummaryStat icon={Building2} label="Open roles" value={openRoles} />
            <SummaryStat icon={Users} label="Candidates" value={totalCandidates} />
            <SummaryStat icon={UserCheck} label="Needs review" value={needsReview} accent />
            <SummaryStat icon={UserCheck} label="Hires" value={hires} />
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {positions.map((pos) => (
              <PositionCard
                key={pos.id}
                position={pos}
                candidates={candidates.filter((c) => c.jdId === pos.id)}
                onEnter={() => selectPosition(pos.id)}
              />
            ))}
          </div>

          <NewRequisitionModal open={open} onClose={() => setOpen(false)} />
        </div>
      </div>
    </div>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4", accent ? "text-indigo-500" : "text-slate-400")} />
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className="mt-2 font-mono text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function PositionCard({
  position,
  candidates,
  onEnter,
}: {
  position: Position;
  candidates: ReturnType<typeof useAppStore.getState>["candidates"];
  onEnter: () => void;
}) {
  const inReview = candidates.filter((c) => c.status === "pending_review").length;
  const active = candidates.filter(
    (c) => c.status === "active" || c.status === "pending_review" || c.status === "parked",
  ).length;
  const hired = candidates.filter((c) => c.status === "hired").length;

  return (
    <button
      type="button"
      onClick={onEnter}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-tight text-slate-900">{position.jd.jobRole.role}</h3>
          <p className="mt-1 flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Building2 className="size-3.5 text-slate-400" /> {position.department}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 text-slate-400" /> {position.location}
            </span>
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
            position.status === "open" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500",
          )}
        >
          {position.status === "open" ? "Open" : "On hold"}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-5 border-t border-slate-100 pt-4 text-sm">
        <Metric label="Candidates" value={candidates.length} />
        <Metric label="In progress" value={active} />
        <Metric label="Needs review" value={inReview} accent={inReview > 0} />
        {hired > 0 && <Metric label="Hired" value={hired} />}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-[11px] text-slate-400">
          {position.jd.frozen ? "Scored" : "Awaiting scoring"} · opened {relativeTime(position.jd.createdAt)}
        </p>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
          Open workspace
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <p className={cn("font-mono text-lg font-bold", accent ? "text-indigo-600" : "text-slate-900")}>{value}</p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  );
}
