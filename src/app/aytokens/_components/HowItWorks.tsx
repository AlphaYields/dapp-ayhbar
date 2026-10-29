import type { TokenContent } from "@/app/data/tokenContent";
import { Reveal } from "../../_components/Reveal";
import { Eyebrow } from "./Eyebrow";

/** "Deposit. Hold. Earn." — the four-step lifecycle on the surface-deep band. */
export function HowItWorks({ token }: { token: TokenContent }) {
  return (
    <section className="border-t border-white/[0.06] bg-surface-deep">
      <div className="mx-auto max-w-[1240px] px-6 py-[104px] sm:px-10">
        <Eyebrow className="mb-7">How it works</Eyebrow>
        {/* T1/D4: heading scale normalised to the homepage section scale. */}
        <h2 className="font-display text-[clamp(33px,6.5vw,48px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
          Deposit. Hold. <span className="text-brand">Earn.</span>
        </h2>
        <div className="mt-20 grid gap-9 sm:grid-cols-2 lg:grid-cols-4">
          {token.steps.map((s, i) => (
            // T2: hover feedback mirroring the Trust Center "How the engine
            // selects" cards (top border → brand, title → brand).
            <Reveal key={s.num} delay={i * 70} className="group border-t border-white/10 pt-[22px] transition-colors hover:border-brand">
              <div className="mb-4 font-mono text-[14px] font-semibold text-brand">{s.num}</div>
              <div className="mb-[10px] font-display text-[26px] font-bold leading-none text-foreground transition-colors group-hover:text-brand">
                {s.title}
              </div>
              <div className="text-pretty font-sans text-[14px] font-light leading-[1.6] text-foreground/60">
                {s.desc}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
