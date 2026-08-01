import { cn } from "@/lib/utils";
import type { Outcome } from "@/schema";

// The sacred outcome triad — green/red/amber, used nowhere else (UX.md).
const META: Record<Outcome, { label: string; chip: string; dot: string }> = {
  pass: { label: "Pass", chip: "bg-green-100 text-green-700", dot: "bg-green-500" },
  fail: { label: "Fail", chip: "bg-red-100 text-red-700", dot: "bg-red-500" },
  borderline: { label: "Borderline", chip: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
};

export function OutcomeChip({
  outcome,
  showDot = true,
  className,
}: {
  outcome: Outcome;
  showDot?: boolean;
  className?: string;
}) {
  const m = META[outcome];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        m.chip,
        className,
      )}
    >
      {showDot && <span className={cn("size-1.5 rounded-full", m.dot)} />}
      {m.label}
    </span>
  );
}

export const outcomeMeta = META;
