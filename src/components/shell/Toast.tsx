import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Info, Sparkles, Undo2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAppStore, type ToastTone } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const ICON: Record<ToastTone, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warn: AlertTriangle,
  ai: Sparkles,
};

const ICON_COLOR: Record<ToastTone, string> = {
  info: "text-slate-400",
  success: "text-indigo-500",
  warn: "text-slate-500",
  ai: "text-indigo-500",
};

export function Toast() {
  const toast = useAppStore((s) => s.toast);
  const clearToast = useAppStore((s) => s.clearToast);
  const undoLastSwipe = useAppStore((s) => s.undoLastSwipe);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(clearToast, toast.action ? 5000 : 3400);
    return () => window.clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;
  const Icon = ICON[toast.tone];

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-60 -translate-x-1/2">
      <div
        key={toast.id}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="c6-toast pointer-events-auto flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg"
      >
        <Icon className={cn("size-4 shrink-0", ICON_COLOR[toast.tone])} />
        <p className="text-sm font-medium text-slate-700">{toast.message}</p>
        {toast.action === "undo-swipe" && (
          <button
            type="button"
            onClick={undoLastSwipe}
            className="ml-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Undo2 className="size-3.5" /> Undo
          </button>
        )}
      </div>
    </div>
  );
}
