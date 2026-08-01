import { useEffect, useState, type ChangeEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bookmark,
  FileText,
  Loader2,
  Mail,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { type Candidate, type HumanOutcome } from "@/schema";
import { useAppStore } from "@/store/useAppStore";
import { candidateResults, pipelineStage, type PipelineStage } from "@/lib/pipeline";
import { formatDate, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { readUploadedText } from "@/lib/read-file";
import { buildInterviewTranscript } from "@/data/evaluations";
import { Avatar } from "@/components/Avatar";
import { AIEvaluationCard } from "@/components/AIEvaluationCard";
import { GateProgress } from "@/components/GateProgress";
import { MatchFacets } from "@/components/MatchFacets";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Position } from "@/data/positions";

export function ProfileScreen() {
  const candidates = useAppStore((s) => s.candidates);
  const selectedId = useAppStore((s) => s.selectedCandidateId);
  const positions = useAppStore((s) => s.positions);
  const candidate = candidates.find((c) => c.id === selectedId);
  const pos = positions.find((p) => p.id === candidate?.jdId);

  if (!candidate || !pos) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-400">No candidate selected.</div>;
  }
  return <Profile key={candidate.id} candidate={candidate} position={pos} />;
}

function Profile({ candidate, position }: { candidate: Candidate; position: Position }) {
  const gateResults = useAppStore((s) => s.gateResults);
  const commsDrafts = useAppStore((s) => s.commsDrafts);
  const compositeSummaries = useAppStore((s) => s.compositeSummaries);
  const facets = useAppStore((s) => s.facets);
  const transcripts = useAppStore((s) => s.transcripts);
  const goTo = useAppStore((s) => s.goTo);
  const openComms = useAppStore((s) => s.openComms);

  const results = candidateResults(gateResults, candidate.id);
  const comms = commsDrafts
    .filter((d) => d.candidateId === candidate.id)
    .sort((a, b) => a.draftedAt.localeCompare(b.draftedAt));
  const hasOffer = comms.some((d) => d.trigger === "offer");
  const summary = compositeSummaries.find((s) => s.candidateId === candidate.id);
  const facet = facets[candidate.id];
  const isApplicant = candidate.stage === "applicant";
  const stage = isApplicant ? pipelineStage(candidate, gateResults, hasOffer) : null;

  const [pulse, setPulse] = useState<{ order: number; nonce: number } | null>(null);
  useEffect(() => {
    if (!pulse) return;
    const t = window.setTimeout(() => setPulse(null), 1500);
    return () => window.clearTimeout(t);
  }, [pulse]);

  const gateLabel = (order: number) => {
    const def = position.gateDefinitions.find((d) => d.order === order);
    return def ? `Gate ${order} · ${def.label}` : `Gate ${order}`;
  };
  const scrollToGate = (order: number) => {
    setPulse({ order, nonce: Date.now() });
    document.getElementById(`gate-card-${order}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <button
          type="button"
          onClick={() => goTo(candidate.stage === "prospect" ? "shortlist" : "candidates")}
          className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </button>
        <Avatar name={candidate.name} src={candidate.avatarUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-semibold text-slate-900">{candidate.name}</h1>
            <StatusPill status={candidate.status} />
          </div>
          <p className="truncate text-sm text-slate-500">
            {candidate.headline} · {candidate.location} · Applied {relativeTime(candidate.createdAt)}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-6 py-6">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-5">
            {/* gate journey */}
            {isApplicant && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="section-label mb-4">Gate journey</p>
                <GateProgress
                  candidate={candidate}
                  results={gateResults}
                  gateDefinitions={position.gateDefinitions}
                  variant="journey"
                  onSelect={scrollToGate}
                />
              </div>
            )}

            {/* decision panel */}
            {isApplicant && stage ? (
              <DecisionPanel candidate={candidate} stage={stage} position={position} />
            ) : candidate.stage === "prospect" ? (
              <ProspectPanel candidate={candidate} />
            ) : null}

            {/* composite summary */}
            {summary && (
              <div className="rounded-xl border border-l-4 border-slate-200 border-l-indigo-500 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                    <Sparkles className="size-3.5" /> Composite Summary
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {summary.terminalState === "hired" ? "Hired" : "Rejected"} · {formatDate(summary.generatedAt)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{summary.summary}</p>
              </div>
            )}

            {/* timeline */}
            <div>
              <p className="section-label mb-3">Gate results</p>
              <div className="space-y-4">
                {results.map((r) => {
                  const isPulsing = pulse?.order === r.gateOrder;
                  const def = position.gateDefinitions.find((d) => d.order === r.gateOrder);
                  const fullTranscript =
                    def?.type === "interview_eval"
                      ? transcripts[r.id] ??
                        buildInterviewTranscript(candidate.name, position.jd.jobRole.role, r.gateOrder, r.rawInput)
                      : undefined;
                  return (
                    <div
                      key={isPulsing ? `g${r.gateOrder}-${pulse.nonce}` : `g${r.gateOrder}`}
                      id={`gate-card-${r.gateOrder}`}
                      className={cn("scroll-mt-4", isPulsing && "c6-gate-highlight")}
                    >
                      <AIEvaluationCard
                        result={r}
                        gateLabel={gateLabel(r.gateOrder)}
                        fullTranscript={fullTranscript}
                      />
                    </div>
                  );
                })}
                {results.length === 0 && <p className="text-sm text-slate-400">No gate evaluations yet.</p>}
              </div>
            </div>
          </div>

          {/* aside */}
          <aside className="space-y-5">
            {facet && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <MatchFacets facets={facet} className="sm:grid-cols-1 sm:gap-4" />
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="section-label mb-3">Context</p>
              <dl className="space-y-2 text-sm">
                <Row label="Role" value={position.jd.jobRole.role} />
                <Row label="Stage" value={candidate.stage === "applicant" ? "Applicant" : "Prospect"} />
                <Row label="Current gate" value={candidate.currentGate ? `Gate ${candidate.currentGate}` : "—"} />
                <Row label="Source" value={candidate.source ?? "—"} />
                <Row label="Applied" value={formatDate(candidate.createdAt)} />
              </dl>
              <button
                type="button"
                onClick={() => goTo("jd")}
                className="mt-3 flex w-full items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-left text-xs text-slate-600 transition hover:bg-slate-100"
              >
                <FileText className="size-3.5 text-slate-400" />
                <span className="flex-1">View the role & criteria</span>
                <ArrowRight className="size-3.5 text-slate-400" />
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="section-label mb-3">Messages</p>
              {comms.length === 0 ? (
                <p className="text-xs text-slate-400">No messages drafted yet.</p>
              ) : (
                <div className="space-y-2">
                  {comms.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => openComms(d.id)}
                      className="flex w-full items-center gap-2.5 rounded-lg border border-slate-200 p-2.5 text-left transition hover:border-indigo-300 hover:bg-slate-50"
                    >
                      <Mail className="size-4 shrink-0 text-indigo-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium capitalize text-slate-700">{d.trigger}</p>
                        <p className="truncate text-[11px] text-slate-400">{d.subject}</p>
                      </div>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] uppercase text-slate-500">
                        {d.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Decision panel — the inline gate-decision surface (Resolve / Override / Advance)
// ---------------------------------------------------------------------------
function DecisionPanel({
  candidate,
  stage,
  position,
}: {
  candidate: Candidate;
  stage: PipelineStage;
  position: Position;
}) {
  const evaluatingId = useAppStore((s) => s.evaluatingCandidateId);
  const resolveGate = useAppStore((s) => s.resolveGate);
  const overrideGate = useAppStore((s) => s.overrideGate);
  const advance = useAppStore((s) => s.advanceCandidate);
  const reject = useAppStore((s) => s.rejectCandidate);
  const markHired = useAppStore((s) => s.markHired);
  const unpark = useAppStore((s) => s.unpark);
  const openComms = useAppStore((s) => s.openComms);
  const commsDrafts = useAppStore((s) => s.commsDrafts);
  const [reason, setReason] = useState("");

  if (evaluatingId === candidate.id) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50/50 px-5 py-4">
        <Loader2 className="size-5 animate-spin text-indigo-500" />
        <div>
          <p className="text-sm font-medium text-slate-800">Evaluation running…</p>
          <p className="text-xs text-slate-500">Scoring the next gate against the role and prior history.</p>
        </div>
      </div>
    );
  }

  if (stage === "hired") return null;

  const order = candidate.currentGate ?? 1;
  const def = position.gateDefinitions.find((d) => d.order === order);

  if (stage === "awaiting") {
    return def?.type === "test_import" ? (
      <TestInputPanel candidateId={candidate.id} order={order} label={def.label} />
    ) : (
      <TranscriptInputPanel candidateId={candidate.id} order={order} label={def?.label ?? "Interview"} />
    );
  }

  const offerDraft = commsDrafts.find((d) => d.candidateId === candidate.id && d.trigger === "offer");
  const reasonOk = reason.trim().length > 0;
  const doResolve = (o: HumanOutcome) => resolveGate(candidate.id, order, o, reason.trim() || undefined);
  const doOverride = (o: HumanOutcome) => {
    if (!reasonOk) return;
    overrideGate(candidate.id, order, o, reason.trim());
    setReason("");
  };

  const showReason = ["borderline", "passed", "passed_final", "failed", "rejected"].includes(stage);
  const title: Record<PipelineStage, string> = {
    borderline: `Gate ${order} is Borderline. Your decision`,
    failed: `Gate ${order} failed. Confirm or override`,
    passed: `Gate ${order} cleared. Advance when ready`,
    passed_final: "Final gate cleared. Extend an offer",
    offer: "Conditional offer is out",
    parked: "This candidate is parked",
    rejected: "Candidate was rejected",
    hired: "",
    awaiting: "Awaiting evaluation",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="section-label">Your decision</span>
        {def && <span className="text-xs text-slate-400">· {def.label}</span>}
      </div>
      <p className="mt-1 text-sm font-medium text-slate-700">{title[stage]}</p>

      {showReason && (
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={
            stage === "borderline"
              ? "Optional note on how you settled this…"
              : "Required to override a clear AI outcome. Record your reasoning…"
          }
          className="mt-3 min-h-16"
        />
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {stage === "borderline" && (
          <>
            <Button onClick={() => doResolve("pass")}>Resolve → Pass</Button>
            <Button variant="danger" onClick={() => doResolve("fail")}>
              Resolve → Fail
            </Button>
          </>
        )}
        {(stage === "passed" || stage === "passed_final") && (
          <>
            <Button onClick={() => advance(candidate.id)}>
              <ArrowRight className="size-4" />
              {stage === "passed_final" ? "Extend conditional offer" : "Advance to next gate"}
            </Button>
            <Button variant="danger" disabled={!reasonOk} onClick={() => doOverride("fail")}>
              Override → Fail
            </Button>
          </>
        )}
        {stage === "failed" && (
          <>
            <Button variant="dangerSolid" onClick={() => reject(candidate.id)}>
              <X className="size-4" /> Confirm rejection
            </Button>
            <Button variant="secondary" disabled={!reasonOk} onClick={() => doOverride("pass")}>
              Override → Pass
            </Button>
          </>
        )}
        {stage === "offer" && (
          <>
            <Button onClick={() => markHired(candidate.id)}>
              <BadgeCheck className="size-4" /> Mark as hired
            </Button>
            {offerDraft && (
              <Button variant="secondary" onClick={() => openComms(offerDraft.id)}>
                <Mail className="size-4" /> {offerDraft.status === "sent" ? "View offer" : "Review & send offer"}
              </Button>
            )}
            <Button variant="danger" onClick={() => reject(candidate.id)}>
              Reject
            </Button>
          </>
        )}
        {stage === "parked" && (
          <Button onClick={() => unpark(candidate.id)}>
            <RotateCcw className="size-4" /> Un-park &amp; resume
          </Button>
        )}
        {stage === "rejected" && (
          <Button disabled={!reasonOk} onClick={() => doOverride("pass")}>
            <RotateCcw className="size-4" /> Override → Pass · re-open
          </Button>
        )}
      </div>

      {["passed", "passed_final", "failed", "rejected"].includes(stage) && !reasonOk && (
        <p className="mt-2 text-[11px] text-slate-400">Overriding a clear AI outcome requires a reason.</p>
      )}
    </div>
  );
}

function ProspectPanel({ candidate }: { candidate: Candidate }) {
  const swipe = useAppStore((s) => s.swipe);
  const swipeDecisions = useAppStore((s) => s.swipeDecisions);
  const decided = swipeDecisions[candidate.id];

  if (decided) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="section-label mb-1">Review decision</p>
        <p className="text-sm text-slate-600">
          Recorded: <span className="font-medium capitalize text-slate-800">{decided}</span>
          {decided === "advance" && " — outreach drafted."}
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="section-label mb-3">Review decision</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => swipe(candidate.id, "advance")}>
          <ArrowRight className="size-4" /> Advance · draft outreach
        </Button>
        <Button variant="secondary" onClick={() => swipe(candidate.id, "park")}>
          <Bookmark className="size-4" /> Park
        </Button>
        <Button variant="danger" onClick={() => swipe(candidate.id, "reject")}>
          <X className="size-4" /> Reject
        </Button>
      </div>
    </div>
  );
}

const SAMPLE_TRANSCRIPT = `Interviewer: Walk me through how you'd approach the core parts of this role.
Candidate: I start by understanding the priorities and the people involved, then map the process end to end before changing anything. I document as I go so there's a clear trail.
Interviewer: How do you handle something going wrong under time pressure?
Candidate: I stabilise first, communicate early to whoever is affected, then fix the root cause and write up what happened so it doesn't repeat.
Interviewer: Give an example of improving how something was done.
Candidate: In my last role I consolidated three trackers into one, which halved the weekly reporting time and reduced errors.`;

function TestInputPanel({ candidateId, order, label }: { candidateId: string; order: number; label: string }) {
  const importTestResult = useAppStore((s) => s.importTestResult);
  const [value, setValue] = useState("");
  const num = Number(value);
  const valid = value !== "" && !Number.isNaN(num) && num >= 0 && num <= 100;
  return (
    <div className="rounded-xl border border-l-4 border-slate-200 border-l-indigo-500 bg-white p-5 shadow-sm">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
        <Upload className="size-3.5" /> Import test result
      </span>
      <p className="mt-2.5 text-sm text-slate-600">
        Enter the {label} score from the external assessment platform. The pass mark is 80%.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Input
            type="number"
            min={0}
            max={100}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="85"
            className="w-28 pr-7"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
        </div>
        <Button variant="secondary" onClick={() => setValue(String(82 + Math.floor(Math.random() * 10)))}>
          Fetch score
        </Button>
        <Button disabled={!valid} onClick={() => importTestResult(candidateId, order, num)}>
          Import result
        </Button>
      </div>
    </div>
  );
}

function TranscriptInputPanel({ candidateId, order, label }: { candidateId: string; order: number; label: string }) {
  const evaluateTranscript = useAppStore((s) => s.evaluateTranscript);
  const [transcript, setTranscript] = useState("");
  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await readUploadedText(file);
    if (text) setTranscript(text);
    e.target.value = "";
  };
  return (
    <div className="rounded-xl border border-l-4 border-slate-200 border-l-indigo-500 bg-white p-5 shadow-sm">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
        <Sparkles className="size-3.5" /> {label} evaluation
      </span>
      <p className="mt-2.5 text-sm text-slate-600">
        Upload or paste the interview transcript, then run the AI evaluation against the role and prior gates.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
          <Upload className="size-4" /> Upload .txt / .docx
          <input type="file" accept=".txt,.docx,text/plain" className="hidden" onChange={onFile} />
        </label>
        <Button variant="secondary" size="sm" onClick={() => setTranscript(SAMPLE_TRANSCRIPT)}>
          Load sample
        </Button>
      </div>
      <Textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Paste the interview transcript here, or upload a file above."
        className="mt-3 min-h-32"
      />
      <Button className="mt-3" onClick={() => evaluateTranscript(candidateId, order, transcript)}>
        <Sparkles className="size-4" /> Run AI evaluation
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="truncate font-medium text-slate-700">{value}</dd>
    </div>
  );
}
