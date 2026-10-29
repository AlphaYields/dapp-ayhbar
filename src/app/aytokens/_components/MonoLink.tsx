import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Wide-tracked lime mono link with a trailing arrow icon, used for the inline
 * "Inspect these markets →" / "Full risk framework →" links on the token pages.
 * Uses a lucide glyph rather than the `→` text character (redesign D44).
 */
export function MonoLink({
  href,
  external = false,
  className,
  children,
}: {
  href: string;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const cls = cn(
    "group inline-flex items-center gap-[9px] font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-brand",
    className,
  );
  const content = (
    <>
      {children}
      <ArrowRight className="size-[14px] transition-transform group-hover:translate-x-1" />
    </>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {content}
    </Link>
  );
}
