import { useEffect, useState } from "react";
import { Monitor } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

// Contra6 Recruit's multi-region layouts are built for desktop; below this width
// we show a full-screen notice rather than a broken layout.
const MIN_WIDTH = 1024;

export function SmallScreenGate() {
  const [width, setWidth] = useState(() => (typeof window === "undefined" ? MIN_WIDTH : window.innerWidth));
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (width >= MIN_WIDTH || dismissed) return null;

  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-white px-6 text-center">
      <div className="flex items-center gap-2.5">
        <Logo className="size-8" />
        <div className="text-left leading-tight">
          <p className="text-sm font-semibold text-slate-900">Contra6 Recruit</p>
          <p className="text-[11px] text-slate-400">AI-native ATS</p>
        </div>
      </div>

      <div className="mt-8 flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <Monitor className="size-7" />
      </div>
      <h1 className="mt-5 text-lg font-semibold text-slate-900">Best viewed on a larger screen</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
        Contra6 Recruit is built for desktop. For the full experience, open it on a laptop or widen your browser window
        to at least {MIN_WIDTH}px.
      </p>
      <p className="mt-4 font-mono text-xs text-slate-400">Current width: {width}px</p>

      <Button variant="secondary" className="mt-6" onClick={() => setDismissed(true)}>
        Continue anyway
      </Button>
    </div>
  );
}
