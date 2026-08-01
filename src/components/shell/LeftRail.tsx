import { Building2, FileText, Layers, LayoutDashboard, ListChecks, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAppStore, type Screen } from "@/store/useAppStore";
import { RECRUITER_NAME } from "@/lib/constants";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const WORKSPACE_NAV: { screen: Screen; label: string; icon: LucideIcon }[] = [
  { screen: "jd", label: "Role & JD", icon: FileText },
  { screen: "shortlist", label: "Shortlist", icon: ListChecks },
  { screen: "swipe", label: "Swipe Review", icon: Layers },
  { screen: "candidates", label: "Candidates", icon: Users },
];

export function LeftRail() {
  const activeScreen = useAppStore((s) => s.activeScreen);
  const activePositionId = useAppStore((s) => s.activePositionId);
  const positions = useAppStore((s) => s.positions);
  const candidates = useAppStore((s) => s.candidates);
  const swipeDecisions = useAppStore((s) => s.swipeDecisions);
  const goHome = useAppStore((s) => s.goHome);
  const goTo = useAppStore((s) => s.goTo);

  const pos = positions.find((p) => p.id === activePositionId);
  const posCands = pos ? candidates.filter((c) => c.jdId === pos.id) : [];
  const prospects = posCands.filter((c) => c.stage === "prospect");
  const deck = prospects.filter(
    (c) => !swipeDecisions[c.id] && c.status !== "rejected" && c.status !== "parked",
  );
  const applicants = posCands.filter(
    (c) =>
      c.stage === "applicant" &&
      (c.status === "active" || c.status === "pending_review" || c.status === "parked"),
  );
  const counts: Partial<Record<Screen, number>> = {
    shortlist: prospects.length,
    swipe: deck.length,
    candidates: applicants.length,
  };

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
      <button
        type="button"
        onClick={goHome}
        className="flex items-center gap-2.5 px-5 pb-3 pt-5 text-left"
      >
        <Logo className="size-8" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">Contra6 Recruit</p>
          <p className="text-[11px] text-slate-400">AI-native ATS</p>
        </div>
      </button>

      <div className="mb-2 px-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2">
          <Building2 className="size-4 shrink-0 text-slate-400" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold text-slate-700">Prime Focus Group</p>
            <p className="text-[10px] text-slate-400">Prime AC · Client workspace</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        <RailItem
          icon={LayoutDashboard}
          label="Dashboard"
          active={activeScreen === "dashboard"}
          onClick={goHome}
        />
      </nav>

      {pos && (
        <>
          <div className="mt-5 px-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="section-label">Active Requisition</p>
              <p className="mt-1.5 text-sm font-semibold leading-tight text-slate-900">{pos.jd.jobRole.role}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">{pos.department}</p>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    pos.status === "open" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500",
                  )}
                >
                  {pos.status === "open" ? "Open" : "On hold"}
                </span>
                <span className="text-[11px] text-slate-400">{pos.location}</span>
              </div>
            </div>
          </div>

          <nav className="mt-4 flex flex-1 flex-col gap-0.5 px-3">
            <p className="section-label px-2 pb-1">Workspace</p>
            {WORKSPACE_NAV.map((item) => (
              <RailItem
                key={item.screen}
                icon={item.icon}
                label={item.label}
                count={counts[item.screen]}
                active={activeScreen === item.screen}
                onClick={() => goTo(item.screen)}
              />
            ))}
          </nav>
        </>
      )}

      <div className="mt-auto border-t border-slate-200">
        <div className="flex items-center gap-2.5 px-5 py-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
            {initials(RECRUITER_NAME)}
          </div>
          <div className="leading-tight">
            <p className="text-xs font-medium text-slate-700">{RECRUITER_NAME}</p>
            <p className="text-[11px] text-slate-400">Talent Acquisition</p>
          </div>
        </div>
        <p className="border-t border-slate-100 px-5 py-2.5 text-[10px] text-slate-400">
          Powered by <span className="font-semibold text-slate-500">Contra6</span>
        </p>
      </div>
    </aside>
  );
}

function RailItem({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600" />}
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {count != null && (
        <span
          className={cn(
            "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums",
            active ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
