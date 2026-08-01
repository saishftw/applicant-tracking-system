import { Check } from "lucide-react";
import { useAppStore, type Screen } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const STEPS: { n: number; label: string; screen: Screen }[] = [
  { n: 1, label: "Role", screen: "jd" },
  { n: 2, label: "Shortlist", screen: "shortlist" },
  { n: 3, label: "Swipe", screen: "swipe" },
  { n: 4, label: "Candidates", screen: "candidates" },
];

export function TopBar() {
  const activeScreen = useAppStore((s) => s.activeScreen);
  const activePositionId = useAppStore((s) => s.activePositionId);
  const positions = useAppStore((s) => s.positions);
  const goTo = useAppStore((s) => s.goTo);

  const pos = positions.find((p) => p.id === activePositionId);

  if (activeScreen === "dashboard" || !pos) {
    return (
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div>
          <p className="text-sm font-semibold text-slate-900">Requisitions</p>
          <p className="text-xs text-slate-400">All open roles at Prime Focus Group (Prime AC)</p>
        </div>
      </header>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.screen === activeScreen);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6">
      <nav className="flex items-center gap-1" aria-label="Requisition workflow">
        {STEPS.map((step, i) => {
          const active = i === currentIndex;
          const done = currentIndex > i && currentIndex !== -1;
          return (
            <div key={step.n} className="flex items-center">
              <button
                type="button"
                onClick={() => goTo(step.screen)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full font-mono text-[11px] font-bold",
                    active
                      ? "bg-indigo-600 text-white"
                      : done
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-slate-200 text-slate-500",
                  )}
                >
                  {done ? <Check className="size-3" /> : step.n}
                </span>
                <span className="hidden md:inline">{step.label}</span>
              </button>
              {i < STEPS.length - 1 && <span className="mx-0.5 h-px w-4 bg-slate-200" />}
            </div>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
        <span className={cn("size-2 rounded-full", pos.status === "open" ? "bg-indigo-500" : "bg-slate-400")} />
        <span className="text-sm font-medium text-slate-700">
          {pos.jd.jobRole.role} · {pos.department}
        </span>
      </div>
    </header>
  );
}
