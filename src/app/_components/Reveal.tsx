"use client";

import { useEffect, useRef, useState, type ElementType } from "react";
import { cn } from "@/lib/utils";

/**
 * Fade-up-on-scroll wrapper — dapp shim for the landing's GSAP `Reveal`.
 * Uses an IntersectionObserver + CSS transition (no GSAP/ScrollTrigger
 * dependency). Honours `prefers-reduced-motion` by showing immediately.
 */
export function Reveal({
  as: Tag = "div",
  delay = 0,
  y = 24,
  className,
  children,
  ...props
}: {
  as?: ElementType;
  delay?: number;
  y?: number;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -14% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn("transition-all duration-700 ease-out motion-reduce:transition-none", className)}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : `translateY(${y}px)`,
        transitionDelay: `${delay}ms`,
      }}
      {...props}
    >
      {children}
    </Tag>
  );
}
