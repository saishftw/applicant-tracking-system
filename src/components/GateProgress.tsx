import { effectiveOutcome, type Candidate, type GateDefinition, type GateResult } from "@/schema";
import { resultAtGate } from "@/lib/pipeline";
import { formatScore } from "@/lib/format";
import { cn } from "@/lib/utils";

type SegState = "pass" | "fail" | "borderline" | "current" | "upcoming";

const BAR_FILL: Record<SegState, string> = {
  pass: "bg-green-500",
  fail: "bg-red-500",
  borderline: "bg-amber-500",
  current: "bg-indigo-500",
  upcoming: "bg-slate-200",
};

const DOT: Record<SegState, string> = {
  pass: "bg-green-500 text-white",
  fail: "bg-red-500 text-white",
  borderline: "bg-amber-500 text-white",
  current: "bg-indigo-600 text-white",
  upcoming: "border border-slate-300 bg-white text-slate-400",
};

function segState(order: number, result: GateResult | undefined, current: number, terminal: boolean): SegState {
  if (result) return effectiveOutcome(result);
  if (order === current && !terminal) return "current";
  return "upcoming";
}

/**
 * The candidate's gate journey. `bar` = a compact 6-segment strip for list rows;
 * `journey` = a labelled, clickable stepper with per-gate scores for the profile.
 */
export function GateProgress({
  candidate,
  results,
  gateDefinitions,
  variant = "bar",
  onSelect,
  selectedOrder,
  className,
}: {
  candidate: Candidate;
  results: GateResult[];
  gateDefinitions: GateDefinition[];
  variant?: "bar" | "journey";
  onSelect?: (order: number) => void;
  selectedOrder?: number;
  className?: string;
}) {
  const current = candidate.currentGate ?? 1;
  const terminal = candidate.status === "hired" || candidate.status === "rejected";
  const orders = [1, 2, 3, 4, 5, 6];

  if (variant === "bar") {
    return (
      <div className={cn("flex w-full items-center gap-1", className)}>
        {orders.map((order) => {
          const result = resultAtGate(results, candidate.id, order);
          const state = segState(order, result, current, terminal);
          const isCurrent = order === current && !terminal;
          const def = gateDefinitions.find((d) => d.order === order);
          const title = def
            ? `Gate ${order}: ${def.label}${result ? `: ${formatScore(result.score, result.scoreUnit)}` : ""}`
            : `Gate ${order}`;
          return (
            <div
              key={order}
              title={title}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                BAR_FILL[state],
                isCurrent && "ring-2 ring-indigo-300",
              )}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("relative flex justify-between", className)}>
      <div className="absolute inset-x-4 top-4 h-0.5 bg-slate-200" />
      {orders.map((order) => {
        const result = resultAtGate(results, candidate.id, order);
        const state = segState(order, result, current, terminal);
        const isCurrent = order === current && !terminal;
        const def = gateDefinitions.find((d) => d.order === order);
        const selected = selectedOrder === order;
        return (
          <button
            key={order}
            type="button"
            onClick={() => onSelect?.(order)}
            disabled={!onSelect || !result}
            className={cn(
              "relative z-10 flex flex-1 flex-col items-center gap-1.5 rounded-lg px-1 pb-1 pt-0.5",
              onSelect && result && "cursor-pointer",
              selected && "bg-slate-50",
            )}
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full font-mono text-xs font-bold ring-4 ring-white",
                DOT[state],
                isCurrent && "ring-indigo-100",
              )}
            >
              {order}
            </span>
            <span className="max-w-24 text-center text-[10px] leading-tight text-slate-500">
              {def?.label ?? `Gate ${order}`}
            </span>
            {result ? (
              <span className="font-mono text-[11px] font-semibold text-slate-700">
                {formatScore(result.score, result.scoreUnit)}
              </span>
            ) : (
              <span className="text-[11px] text-slate-300">—</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
