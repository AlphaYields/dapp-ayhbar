import { cn } from "@/lib/utils";

/**
 * Section eyebrow for the token pages — a short lime bar followed by a
 * wide-tracked mono label, matching the detail designs. `plain` drops the bar
 * (used by the muted "Trust Center" eyebrow on the transparency band).
 */
export function Eyebrow({
  children,
  plain = false,
  className,
}: {
  children: React.ReactNode;
  plain?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-[13px]", className)}>
      {plain ? null : (
        <span className="h-[6px] w-[30px] shrink-0 rounded-[3px] bg-brand" />
      )}
      <span
        className={cn(
          "font-mono text-[11.5px] font-medium uppercase tracking-[0.2em]",
          plain ? "text-foreground/45" : "text-brand",
        )}
      >
        {children}
      </span>
    </div>
  );
}
