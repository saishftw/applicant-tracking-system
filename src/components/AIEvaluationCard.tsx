import { useState } from "react";
import { ArrowRight, Expand, Sparkles, UserCheck } from "lucide-react";
import { type GateResult } from "@/schema";
import { formatDate, formatScore, relativeTime, scoreDenominator } from "@/lib/format";
import { cn } from "@/lib/utils";
import { OutcomeChip } from "./OutcomeChip";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

/** The full AI evaluation card: indigo left border, score + outcome (AI and any
 *  human decision side by side), headline, reasoning, and source evidence.
 *  Used on the swipe card, gate drawer, and profile timeline (UX.md). */
export function AIEvaluationCard({
  result,
  gateLabel,
  showSnippet = true,
  fullTranscript,
  className,
}: {
  result: GateResult;
  gateLabel?: string;
  showSnippet?: boolean;
  fullTranscript?: string;
  className?: string;
}) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const den = scoreDenominator(result.scoreUnit);
  const isImport = result.scoreUnit === "percentage";
  return (
    <div
      className={cn(
        "rounded-xl border border-l-4 border-slate-200 border-l-indigo-500 bg-white p-5 shadow-sm",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          {gateLabel && <p className="text-sm font-semibold text-slate-900">{gateLabel}</p>}
          <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
            <Sparkles className="size-3.5" />
            {isImport ? "Imported result" : "AI evaluation"}
          </span>
        </div>
        <Badge
          variant="mono"
          title={isImport ? "Assessment import handler version" : "AI evaluator model version"}
        >
          {result.evaluatorVersion}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-baseline gap-0.5 font-mono text-4xl font-bold leading-none text-slate-900">
          <span>{formatScore(result.score, result.scoreUnit)}</span>
          {den && <span className="text-lg font-medium text-slate-400">{den}</span>}
        </div>
        <OutcomeVerdict result={result} />
      </div>

      <p className="mt-3 font-mono text-sm font-medium text-slate-800">{result.headline}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{result.reasoning}</p>

      {result.humanDecision && <HumanDecisionNote result={result} />}

      {showSnippet && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <p className="section-label">{isImport ? "Imported artifact" : "Source snippet evidence"}</p>
            {fullTranscript && (
              <button
                type="button"
                onClick={() => setTranscriptOpen(true)}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-indigo-600 transition hover:text-indigo-700"
              >
                <Expand className="size-3.5" />
                View full transcript
              </button>
            )}
          </div>
          <p className="border-l-2 border-slate-200 pl-3 font-mono text-xs italic leading-relaxed text-slate-500">
            {result.rawInput}
          </p>
        </div>
      )}

      <p className="mt-4 font-mono text-[11px] text-slate-400">
        Evaluated {relativeTime(result.evaluatedAt)} · {formatDate(result.evaluatedAt)}
      </p>

      {fullTranscript && (
        <Dialog open={transcriptOpen} onOpenChange={setTranscriptOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{gateLabel ?? "Interview"} — full transcript</DialogTitle>
              <DialogDescription>The raw source the AI evaluated · {result.evaluatorVersion}</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-700">{fullTranscript}</pre>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/** AI outcome always visible; when a human diverged, both show side by side (ADR 0003). */
function OutcomeVerdict({ result }: { result: GateResult }) {
  const hd = result.humanDecision;
  if (!hd) return <OutcomeChip outcome={result.aiOutcome} />;
  return (
    <div className="flex items-center gap-2">
      <OutcomeChip outcome={result.aiOutcome} className="opacity-50" />
      <ArrowRight className="size-4 text-slate-400" />
      <OutcomeChip outcome={hd.outcome} />
      <span className="text-xs font-medium text-indigo-600">Human</span>
    </div>
  );
}

function HumanDecisionNote({ result }: { result: GateResult }) {
  const hd = result.humanDecision;
  if (!hd) return null;
  const verb = hd.kind === "override" ? "Overrode" : "Resolved";
  return (
    <div className="mt-4 rounded-lg bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
        <UserCheck className="size-3.5 text-indigo-500" />
        {verb} to {hd.outcome === "pass" ? "Pass" : "Fail"} · {hd.actor}
      </div>
      {hd.reason && <p className="mt-1 text-xs leading-relaxed text-slate-500">“{hd.reason}”</p>}
    </div>
  );
}
