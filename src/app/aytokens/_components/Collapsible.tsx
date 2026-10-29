"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Expand/collapse wrapper. Animates the panel's measured `height` (0 ↔ content)
 * rather than a CSS `grid-rows:0fr` (which fails to collapse in some browsers,
 * leaving residual height) or a fixed `max-height` (which clips the taller
 * stacked layout on mobile). Settles to `auto` while open so resizing and the
 * mobile single-column layout never clip the content (e.g. the share-price
 * chart). Closed → height 0, fully collapsed.
 */
export function Collapsible({
  open,
  durationMs = 300,
  className,
  children,
}: {
  open: boolean;
  durationMs?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  // null === natural height (`auto`): the initial open state + after an open
  // transition settles. A number drives the height animation.
  const [height, setHeight] = useState<number | null>(open ? null : 0);
  const mounted = useRef(false);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    if (!mounted.current) {
      mounted.current = true;
      return; // no entrance animation on first paint
    }
    if (open) {
      setHeight(el.scrollHeight); // animate 0 → content
      const t = setTimeout(() => setHeight(null), durationMs); // then settle to auto
      return () => clearTimeout(t);
    }
    // closing: pin the current height, then collapse to 0 next frame so the
    // browser has a concrete start value to transition from.
    setHeight(el.scrollHeight);
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setHeight(0)),
    );
    return () => cancelAnimationFrame(raf);
  }, [open, durationMs]);

  return (
    <div
      aria-hidden={!open}
      className={cn("overflow-hidden", className)}
      style={{
        height: height === null ? "auto" : height,
        opacity: open ? 1 : 0,
        transition: `height ${durationMs}ms cubic-bezier(0.4,0,0.2,1), opacity ${durationMs}ms ease`,
      }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}
