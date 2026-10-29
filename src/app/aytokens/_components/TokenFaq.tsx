"use client";

import { useState } from "react";
import type { TokenContent } from "@/app/data/tokenContent";
import { Collapsible } from "./Collapsible";
import { Eyebrow } from "./Eyebrow";

/** "Questions, answered." — single-open FAQ accordion (first item open). */
export function TokenFaq({ token }: { token: TokenContent }) {
  const [open, setOpen] = useState(0);

  return (
    <section className="border-t border-white/[0.06] bg-surface-deep">
      <div className="mx-auto max-w-[1240px] px-6 py-[104px] sm:px-10">
        <Eyebrow className="mb-[26px]">FAQ</Eyebrow>
        {/* T1/D4: heading scale normalised to the homepage section scale. */}
        <h2 className="mb-[52px] font-display text-[clamp(33px,6.5vw,48px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
          Questions, <span className="text-brand">answered.</span>
        </h2>
        <div>
          {token.faqs.map((q, i) => {
            const isOpen = open === i;
            return (
              <div key={q.question} className="border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full h-full cursor-pointer items-center justify-between gap-5 py-[26px] text-left"
                >
                  <span className="font-display text-[27px] font-bold leading-none text-foreground">
                    {q.question}
                  </span>
                  <span className="shrink-0 font-mono text-[20px] leading-none text-brand">
                    {isOpen ? "×" : "+"}
                  </span>
                </button>
                <Collapsible open={isOpen} durationMs={450}>
                  <p className="max-w-[760px] pb-7 text-pretty font-sans text-[16px] font-light leading-[1.65] text-foreground/60">
                    {q.answer}
                  </p>
                </Collapsible>
              </div>
            );
          })}
          <div className="border-t border-white/10" />
        </div>
      </div>
    </section>
  );
}
