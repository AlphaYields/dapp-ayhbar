import { LINKS } from '@/app/links';
import type { TokenContent } from '@/app/data/tokenContent';
import { Reveal } from '../../_components/Reveal';
import { Eyebrow } from './Eyebrow';
import { MonoLink } from './MonoLink';

/** "Risks, stated plainly." — framing on the left, numbered risk rows on the right. */
export function TokenRisk({ token }: { token: TokenContent }) {
  return (
    <section className="border-t border-white/[0.06]">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-6 py-[104px] sm:px-10 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <div>
          <Eyebrow className="mb-[26px]">Risk</Eyebrow>
          {/* T1/D4: heading scale normalised to the homepage section scale. */}
          <h2 className="font-display text-[clamp(33px,6.5vw,48px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
            Risks, <span className="text-brand">stated plainly.</span>
          </h2>
          <p className="mt-6 max-w-[380px] text-pretty font-sans text-[16.5px] font-light leading-[1.65] text-foreground/60">
            {token.riskIntro}
          </p>
          <MonoLink href={LINKS.riskFramework} external className="mt-[34px]">
            Full risk framework
          </MonoLink>
        </div>
        <div>
          {/* T7a: dividers removed at the top (first row) and bottom (trailing
              rule) so the list isn't boxed — only inter-row rules remain. */}
          {token.risks.map((r, i) => (
            <Reveal
              key={r.num}
              className={`grid grid-cols-[60px_1fr] gap-6 py-[34px] ${i > 0 ? 'border-t border-white/10' : ''}`}
            >
              <div className="font-mono text-[15px] font-medium text-brand">{r.num}</div>
              <p className="text-pretty font-sans text-[17px] font-light leading-[1.55] text-foreground/60">
                <b className="font-semibold text-foreground">{r.title}</b> {r.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
