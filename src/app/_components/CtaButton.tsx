import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Marketing CTA rendered as a link (most CTAs navigate to the external app or
 * another route). The interactive shadcn <Button> in components/ui is kept for
 * in-form actions; this is the styled link variant the designs use throughout.
 */
const ctaVariants = cva(
  "inline-flex items-center gap-2 rounded-[10px] font-sans font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        primary:
          "bg-brand font-semibold text-background hover:-translate-y-px hover:brightness-110",
        ghost:
          "border border-foreground/20 text-foreground hover:border-brand/55 hover:bg-brand/[0.06]",
      },
      size: {
        sm: "px-[18px] py-[9px] text-[13.5px]",
        md: "px-[26px] py-[13px] text-[15px]",
        lg: "px-8 py-[15px] text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function CtaButton({
  href,
  external = false,
  arrow = true,
  disabled = false,
  variant,
  size,
  className,
  children,
  onClick,
}: {
  /** Omit to render an in-page action `<button>` (e.g. opens the deposit modal). */
  href?: string;
  external?: boolean;
  arrow?: boolean;
  /** Renders an inert, muted button — used for tokens that aren't mintable yet. */
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
} & VariantProps<typeof ctaVariants>) {
  const content = (
    <>
      {children}
      {arrow && !disabled ? <span className="leading-none">→</span> : null}
    </>
  );
  const classes = cn(ctaVariants({ variant, size }), className);

  // Inert mode wins over href/onClick so a disabled CTA can never navigate.
  if (disabled) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className={cn(
          classes,
          "cursor-not-allowed border border-white/10 bg-white/[0.06] text-foreground/40 hover:translate-y-0 hover:brightness-100"
        )}
      >
        {content}
      </button>
    );
  }

  if (!href) {
    return (
      <button type="button" className={classes} onClick={onClick}>
        {content}
      </button>
    );
  }

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} onClick={onClick}>
      {content}
    </Link>
  );
}
