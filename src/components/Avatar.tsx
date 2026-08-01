import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

const SIZES = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-16 text-xl",
} as const;

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  if (src) {
    return (
      <img src={src} alt={name} className={cn("shrink-0 rounded-full object-cover", SIZES[size], className)} />
    );
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-indigo-50 font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-100",
        SIZES[size],
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
