import { ChevronRight, Loader2, Sparkles, UserSearch } from "lucide-react";
import { effectiveOutcome, type GateResult } from "@/schema";
import { useAppStore } from "@/store/useAppStore";
import { resultAtGate } from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Avatar } from "@/components/Avatar";
import { ScoreLine } from "@/components/ScoreLine";
import { SkillChip, GapChip } from "@/components/chips";
import { Button } from "@/components/ui/button";

const DECISION_LABEL: Record<string, string> = {
  advance: "Advanced · outreach drafted",
  park: "Parked",
  reject: "Rejected",
};

export function ShortlistScreen() {
  const activePositionId = useAppStore((s) => s.activePositionId);
  const positions = useAppStore((s) => s.positions);
  const candidates = useAppStore((s) => s.candidates);
  const gateResults = useAppStore((s) => s.gateResults);
  const facets = useAppStore((s) => s.facets);
  const swipeDecisions = useAppStore((s) => s.swipeDecisions);
  const openProfile = useAppStore((s) => s.openProfile);
  const goTo = useAppStore((s) => s.goTo);
  const sourceCandidates = useAppStore((s) => s.sourceCandidates);
  const sourcingPositionId = useAppStore((s) => s.sourcingPositionId);

  const pos = positions.find((p) => p.id === activePositionId);
  const rows = candidates
    .filter((c) => c.stage === "prospect" && c.jdId === activePositionId)
    .map((c) => ({ candidate: c, result: resultAtGate(gateResults, c.id, 1) }))
    .filter((r): r is { candidate: (typeof candidates)[number]; result: GateResult } => Boolean(r.result))
    .sort((a, b) => b.result.score - a.result.score);

  const counts = { pass: 0, borderline: 0, fail: 0 };
  for (const r of rows) counts[effectiveOutcome(r.result)] += 1;

  const remaining = rows.filter((r) => !swipeDecisions[r.candidate.id]).length;
  const empty = rows.length === 0;
  const sourcing = sourcingPositionId === pos?.id;

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-5">
        <ScreenHeader
          eyebrow={pos ? `${pos.jd.jobRole.role} · Pre-screen` : "Pre-screen"}
          title="Shortlist"
          subtitle="Every candidate arrives with a pre-screen score and a reason, never a bare number. Ranked résumé against the role."
          actions={
            empty ? undefined : (
              <Button size="lg" onClick={() => goTo("swipe")} disabled={remaining === 0}>
                <Sparkles className="size-4" />
                {remaining > 0 ? `Start Swipe Review · ${remaining}` : "Swipe complete"}
              </Button>
            )
          }
        />
        {!empty && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <Stat label="Candidates" value={rows.length} tone="slate" />
            <Stat label="Pass" value={counts.pass ?? 0} tone="green" />
            <Stat label="Borderline" value={counts.borderline ?? 0} tone="amber" />
            <Stat label="Fail" value={counts.fail ?? 0} tone="red" />
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {empty ? (
          <SourcingState sourcing={sourcing} onSource={sourceCandidates} role={pos?.jd.jobRole.role} />
        ) : (
          <div className="mx-auto max-w-5xl space-y-2.5">
          {rows.map((row, i) => {
            const { candidate, result } = row;
            const decision = swipeDecisions[candidate.id];
            const f = facets[candidate.id];
            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => openProfile(candidate.id)}
                className={cn(
                  "flex w-full gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md",
                  decision === "reject" && "opacity-60",
                )}
              >
                <span className="w-5 shrink-0 pt-1 text-center font-mono text-sm font-semibold text-slate-300">
                  {i + 1}
                </span>
                <Avatar name={candidate.name} src={candidate.avatarUrl} size="md" className="mt-0.5" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{candidate.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {candidate.headline} · {candidate.location}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <ScoreLine result={result} size="sm" showHeadline={false} />
                      {decision && (
                        <span className="hidden rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500 sm:inline">
                          {DECISION_LABEL[decision]}
                        </span>
                      )}
                      <ChevronRight className="size-4 shrink-0 text-slate-300" />
                    </div>
                  </div>

                  <p className="mt-2 font-mono text-sm leading-snug text-slate-600">{result.headline}</p>

                  {f && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {f.matchingSkills.slice(0, 3).map((s) => (
                        <SkillChip key={s}>{s}</SkillChip>
                      ))}
                      <GapChip>{f.gap}</GapChip>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}

function SourcingState({
  sourcing,
  onSource,
  role,
}: {
  sourcing: boolean;
  onSource: () => void;
  role?: string;
}) {
  const STEPS = [
    "Searching LinkedIn & job boards",
    "Matching profiles to the role",
    "Scoring against the criteria",
    "Ranking the shortlist",
  ];
  if (sourcing) {
    return (
      <div className="c6-rise mx-auto mt-10 max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <Loader2 className="size-6 animate-spin" />
        </div>
        <h2 className="mt-4 text-center text-lg font-semibold text-slate-900">Sourcing candidates…</h2>
        <div className="mt-5 space-y-2.5">
          {STEPS.map((s) => (
            <div key={s} className="flex items-center gap-2 text-sm text-slate-600">
              <span className="size-1.5 shrink-0 rounded-full bg-indigo-400" /> {s}
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <UserSearch className="size-6" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">No candidates yet</h2>
      <p className="mt-1 text-sm text-slate-500">
        Source and score candidates for {role ?? "this role"} from LinkedIn and job boards.
      </p>
      <Button className="mt-5" size="lg" onClick={onSource}>
        <Sparkles className="size-4" /> Source candidates
      </Button>
    </div>
  );
}

const TONE: Record<string, string> = {
  slate: "bg-slate-100 text-slate-600",
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
};

function Stat({ label, value, tone }: { label: string; value: number; tone: keyof typeof TONE }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium", TONE[tone])}>
      <span className="font-mono font-bold tabular-nums">{value}</span>
      {label}
    </span>
  );
}
