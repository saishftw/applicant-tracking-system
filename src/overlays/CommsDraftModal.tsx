import { useEffect, useState } from "react";
import { CheckCircle2, Send, Sparkles } from "lucide-react";
import { type CommsDraft } from "@/schema";
import { useAppStore } from "@/store/useAppStore";
import { relativeTime } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const TRIGGER_LABEL: Record<CommsDraft["trigger"], string> = {
  outreach: "Outreach",
  offer: "Conditional Offer",
  rejection: "Rejection",
};

export function CommsDraftModal() {
  const draftId = useAppStore((s) => s.commsDraftId);
  const closeComms = useAppStore((s) => s.closeComms);
  const commsDrafts = useAppStore((s) => s.commsDrafts);
  const live = commsDrafts.find((d) => d.id === draftId) ?? null;

  const [retained, setRetained] = useState<CommsDraft | null>(live);
  useEffect(() => {
    if (live) setRetained(live);
  }, [live]);

  return (
    <Dialog open={Boolean(live)} onOpenChange={(o) => !o && closeComms()}>
      <DialogContent className="max-w-xl">
        {retained && <ModalBody key={retained.id} draft={retained} />}
      </DialogContent>
    </Dialog>
  );
}

function ModalBody({ draft }: { draft: CommsDraft }) {
  const approveComms = useAppStore((s) => s.approveComms);
  const sendComms = useAppStore((s) => s.sendComms);

  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  useEffect(() => {
    setSubject(draft.subject);
    setBody(draft.body);
  }, [draft.subject, draft.body]);

  const sent = draft.status === "sent";
  const approved = draft.status === "approved";

  return (
    <>
      <DialogHeader>
        <span className="mb-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
          <Sparkles className="size-3.5" /> LLM-drafted · {TRIGGER_LABEL[draft.trigger]}
        </span>
        <DialogTitle>Candidate message</DialogTitle>
        <DialogDescription>
          Review and edit the AI draft, approve it, then send it to the candidate.
        </DialogDescription>
      </DialogHeader>

      {sent && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <CheckCircle2 className="size-4 text-indigo-500" />
          Sent {draft.sentAt ? relativeTime(draft.sentAt) : "just now"}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="section-label mb-1.5 block">Subject</label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={sent} />
        </div>
        <div>
          <label className="section-label mb-1.5 block">Message</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={sent}
            className="min-h-56 font-sans leading-relaxed"
          />
        </div>
      </div>

      <DialogFooter>
        {sent ? (
          <span className="text-xs text-slate-400">This message has been sent.</span>
        ) : approved ? (
          <>
            <Button variant="secondary" onClick={() => approveComms(draft.id, subject, body)}>
              Save edits
            </Button>
            <Button onClick={() => sendComms(draft.id)}>
              <Send className="size-4" /> Send message
            </Button>
          </>
        ) : (
          <Button onClick={() => approveComms(draft.id, subject, body)}>
            <CheckCircle2 className="size-4" /> Approve draft
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
