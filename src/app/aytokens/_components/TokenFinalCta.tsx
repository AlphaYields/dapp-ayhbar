import { LINKS } from '@/app/links';
import type { TokenContent } from '@/app/data/tokenContent';
import { CtaButton } from '../../_components/CtaButton';

/** Closing call-to-action — oversized headline + mint / Trust Center buttons. */
export function TokenFinalCta({ token, onMint }: { token: TokenContent; onMint: () => void }) {
  return (
    <section className="border-t border-white/[0.06] bg-surface-deep">
      <div className="mx-auto max-w-[1240px] px-6 pb-[136px] pt-[128px] text-center sm:px-10">
        {/* T1/D4: scale normalised to the homepage final-CTA scale. */}
        <h2 className="font-display text-[clamp(42px,7vw,60px)] font-extrabold leading-[0.98] tracking-[-0.02em]">
          {token.finalCta.headline}
        </h2>
        <p className="mx-auto mt-6 max-w-[460px] text-pretty font-sans text-[clamp(17px,1.6vw,21px)] font-light leading-[1.55] text-foreground/60">
          {token.finalCta.sub}
        </p>
        <div className="mt-[42px] flex flex-wrap justify-center gap-[14px]">
          <CtaButton onClick={onMint} disabled={token.mintDisabled} size="lg">
            {token.buyBox.mintLabel}
          </CtaButton>
          <CtaButton href={LINKS.routes.trustcenter} external variant="ghost" arrow={false} size="lg">
            Trust Center
          </CtaButton>
        </div>
      </div>
    </section>
  );
}
