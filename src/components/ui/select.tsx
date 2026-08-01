import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Lightweight native select styled to match the design system (used by the JD editor). */
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative inline-flex">
      <select
        ref={ref}
        className={cn(
          "h-8 appearance-none rounded-md border border-slate-200 bg-white pl-2.5 pr-7 text-xs font-medium text-slate-700 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  ),
);
Select.displayName = "Select";
