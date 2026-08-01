import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Neutral / utility badges. The sacred outcome triad lives in OutcomeChip, not here.
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-slate-100 text-slate-600",
        outline: "border border-slate-200 text-slate-600",
        ai: "bg-indigo-50 text-indigo-700",
        mono: "bg-slate-100 font-mono text-[11px] tracking-tight text-slate-500",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
