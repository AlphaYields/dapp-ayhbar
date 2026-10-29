'use client';

import type { TokenContent } from '@/app/data/tokenContent';
import { CtaButton } from '../../_components/CtaButton';
import { TokenLogo } from './TokenLogos';
import { useVaultLive, pct } from './useVaultLive';
import { ApyBreakdown } from './ApyBreakdown';

function Stat({
  label,
  value,
  accent,
  children,
}: {
  label: string;
  value: string;
  accent?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-foreground/40">
        {label}
      </div>
      <div
        className={`inline-flex items-center gap-[7px] font-mono text-[15px] font-semibold ${accent ? 'text-brand' : 'text-foreground'}`}
      >
        {value}
        {children}
      </div>
    </div>
  );
}

/** Detail hero: oversized symbol + LIVE pill + stats, plus the right-hand buy box. */
export function TokenHero({ token, onMint }: { token: TokenContent; onMint: () => void }) {
  const live = useVaultLive(token.address);
  const netApy = pct(live?.apy_1m, token.hero.netApy);
  const breakdown = (className?: string) =>
    typeof live?.apy_kat_1m === 'number' && typeof live.apy_1m === 'number' ? (
      <ApyBreakdown staking={live.apy_kat_1m} net={live.apy_1m} className={className} />
    ) : null;
  const sharePrice =
    typeof live?.last_share_price === 'number' ? live.last_share_price.toFixed(3) : token.buyBox.sharePrice;
  const maxDrawdown =
    typeof live?.max_drawdown === 'number' ? `−${Math.abs(live.max_drawdown).toFixed(1)}%` : token.buyBox.maxDrawdown;

  return (
    <header className="mx-auto grid max-w-[1240px] items-center gap-10 px-6 pb-[68px] pt-[140px] sm:px-10 lg:grid-cols-[1.35fr_0.85fr] lg:gap-16">
      <div>
        <div className="mb-6 flex items-center gap-[13px]">
          <span className="h-[6px] w-[30px] rounded-[3px] bg-brand" />
          <span className="font-mono text-[11.5px] font-medium uppercase tracking-[0.2em] text-brand">
            {token.hero.eyebrow}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-[22px]">
          <h1 className="font-display text-[clamp(76px,12vw,168px)] font-extrabold leading-[0.82] tracking-[-0.03em]">
            {token.symbol}
          </h1>
          <span className="inline-flex items-center gap-2 rounded-[30px] border border-brand/40 px-[14px] py-[6px]">
            <span className="size-[7px] rounded-full bg-brand motion-safe:animate-ay-live" />
            <span className="font-mono text-[11px] font-semibold tracking-[0.18em] text-brand">LIVE</span>
          </span>
        </div>
        <p className="mt-[26px] max-w-[520px] text-pretty font-sans text-[clamp(17px,1.5vw,20px)] font-light leading-[1.6] text-foreground/[0.62]">
          {token.hero.blurb}
        </p>
        <div className="mt-[38px] flex flex-wrap gap-12">
          <Stat label={token.hero.apyLabel ?? 'Net APY'} value={netApy} accent>
            {/* mono digits are centred already; drop the Darker Grotesque nudge */}
            {breakdown('translate-y-0')}
          </Stat>
          <Stat label="Denomination" value={token.hero.denomination} />
          <Stat label={token.hero.methodologyLabel ?? 'Methodology'} value={token.hero.methodology} />
        </div>
      </div>

      {/* buy box */}
      <div className="rounded-[18px] border border-white/[0.08] bg-surface px-[26px] py-7">
        <div className="mb-[22px] flex items-center gap-[14px]">
          <TokenLogo symbol={token.symbol} className="size-[52px] shrink-0" />
          <div>
            <div className="font-display text-2xl font-extrabold leading-none">{token.symbol}</div>
            <div className="mt-[5px] font-mono text-[10.5px] tracking-[0.08em] text-foreground/40">
              {token.buyBox.subline ?? `1 ${token.symbol} = ${sharePrice} ${token.unit}`}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/[0.07] py-[14px]">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-foreground/40">
            {token.buyBox.apyLabel ?? 'Net APY'}
          </span>
          <span className="inline-flex items-center gap-[7px]">
            <span className="font-display text-[28px] font-extrabold leading-none text-brand">{netApy}</span>
            {breakdown()}
          </span>
        </div>
        {(token.buyBox.rows ?? [['Historical Max Drawdown', maxDrawdown]]).map(([label, value], i, rows) => (
          <div
            key={label}
            className={`flex items-center justify-between border-t border-white/[0.07] py-[14px] ${i === rows.length - 1 ? 'mb-5' : ''}`}
          >
            <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-foreground/40">{label}</span>
            <span className="font-mono text-[13px] font-medium text-foreground">{value}</span>
          </div>
        ))}
        <CtaButton
          onClick={onMint}
          disabled={token.mintDisabled}
          size="md"
          className="w-full justify-center py-[14px] text-[15px]"
        >
          {token.buyBox.mintLabel}
        </CtaButton>
      </div>
    </header>
  );
}
