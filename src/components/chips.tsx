import type { ReactNode } from "react";
import { Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// Skill chips = indigo (a match against the JD rubric).
export function SkillChip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700",
        className,
      )}
    >
      {children}
    </span>
  );
}

// Gap chips = amber, a semantic "caution / missing" pastel.
export function GapChip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700",
        className,
      )}
    >
      <Minus className="size-3 shrink-0" />
      {children}
    </span>
  );
}
