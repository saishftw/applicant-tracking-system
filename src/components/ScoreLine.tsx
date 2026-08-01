import { UserCheck } from "lucide-react";
import { effectiveOutcome, type GateResult } from "@/schema";
import { formatScore, scoreDenominator } from "@/lib/format";
import { cn } from "@/lib/utils";
import { OutcomeChip } from "./OutcomeChip";

const SIZE = { sm: "text-xl", md: "text-2xl", lg: "text-4xl" } as const;

/**
 * The signature ScoreLine: bold mono score + /5 + outcome chip + one-line
 * headline. Reused on shortlist rows, swipe cards, pipeline cards, the gate
 * drawer, and the profile timeline (UX.md).
 */
export function ScoreLine({
  result,
  size = "md",
  showHeadline = true,
  className,
}: {
  result: GateResult;
  size?: keyof typeof SIZE;
  showHeadline?: boolean;
  className?: string;
}) {
  const eff = effectiveOutcome(result);
  const den = scoreDenominator(result.scoreUnit);
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <div className={cn("flex items-baseline gap-0.5 font-mono font-bold leading-none text-slate-900", SIZE[size])}>
        <span>{formatScore(result.score, result.scoreUnit)}</span>
        {den && <span className="text-[0.55em] font-medium text-slate-400">{den}</span>}
      </div>
      <OutcomeChip outcome={eff} />
      {result.humanDecision && (
        <UserCheck className="size-4 shrink-0 text-indigo-500" aria-label="Human decision recorded" />
      )}
      {showHeadline && (
        <p className="min-w-0 flex-1 truncate font-mono text-sm text-slate-600">{result.headline}</p>
      )}
    </div>
  );
}
