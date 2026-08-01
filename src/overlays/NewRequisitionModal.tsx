import { useState, type ChangeEvent } from "react";
import { FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { extractJobRole, SAMPLE_JD } from "@/data/extract";
import { useAppStore } from "@/store/useAppStore";
import { COMPANY_NAME } from "@/lib/constants";
import { readUploadedText } from "@/lib/read-file";
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

const STEPS = [
  "Reading the document",
  "Extracting the role & responsibilities",
  "Identifying skills & criteria",
  "Structuring the JD",
];

export function NewRequisitionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createPosition = useAppStore((s) => s.createPosition);
  const [text, setText] = useState("");
  const [department, setDepartment] = useState("");
  const [processing, setProcessing] = useState(false);

  const reset = () => {
    setText("");
    setDepartment("");
    setProcessing(false);
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await readUploadedText(file);
    if (content) setText(content);
    e.target.value = "";
  };

  const submit = () => {
    if (!text.trim()) return;
    setProcessing(true);
    window.setTimeout(() => {
      const jobRole = extractJobRole(text, COMPANY_NAME);
      reset();
      onClose();
      createPosition(jobRole, department);
    }, 1700);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-xl" hideClose={processing}>
        {processing ? (
          <div className="py-6">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Loader2 className="size-6 animate-spin" />
            </div>
            <h2 className="mt-4 text-center text-lg font-semibold text-slate-900">Extracting structured JD…</h2>
            <div className="mx-auto mt-5 max-w-xs space-y-2.5">
              {STEPS.map((s) => (
                <div key={s} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="size-1.5 shrink-0 rounded-full bg-indigo-400" /> {s}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <span className="mb-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                <Sparkles className="size-3.5" /> New requisition
              </span>
              <DialogTitle>Upload a job description</DialogTitle>
              <DialogDescription>
                Paste or upload the JD text. The AI extracts a structured, editable JD you can tune, then freeze.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
                  <Upload className="size-4" /> Upload .txt / .docx
                  <input type="file" accept=".txt,.docx,text/plain" className="hidden" onChange={onFile} />
                </label>
                <Button variant="secondary" size="sm" onClick={() => setText(SAMPLE_JD)}>
                  <FileText className="size-4" /> Load sample JD
                </Button>
              </div>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the job description here…"
                className="min-h-48"
              />
              <div>
                <label className="section-label mb-1.5 block">Department (optional)</label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Finance"
                  className="max-w-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => {
                  reset();
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button disabled={!text.trim()} onClick={submit}>
                <Sparkles className="size-4" /> Extract &amp; Create
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
