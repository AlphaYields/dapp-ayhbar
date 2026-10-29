import type { TokenContent } from "@/app/data/tokenContent";
import { Reveal } from "../../_components/Reveal";
import { Eyebrow } from "./Eyebrow";

/** "What is ayUSD?" — heading on the left, plain-language paragraph on the right. */
export function TokenOverview({ token }: { token: TokenContent }) {
  return (
    <section className="border-t border-white/[0.06]">
      <div className="mx-auto grid max-w-[1240px] items-start gap-12 px-6 py-[104px] sm:px-10 lg:grid-cols-2 lg:gap-[72px]">
        <Reveal>
          <Eyebrow className="mb-7">Overview</Eyebrow>
          {/* T1/D4: heading + body scale normalised to the homepage section scale. */}
          <h2 className="font-display text-[clamp(33px,6.5vw,48px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
            What is {token.overview.headingSuffix}?
          </h2>
        </Reveal>
        <Reveal as="p" className="max-w-[560px] text-pretty font-sans text-[clamp(16px,1.4vw,18px)] font-light leading-[1.6] text-foreground/[0.62]">
          {token.overview.body}
        </Reveal>
      </div>
    </section>
  );
}
