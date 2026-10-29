'use client';

import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LINKS } from '@/app/links';
import type { Alloc, TokenContent } from '@/app/data/tokenContent';
import type { SubVault } from '@/app/data/types/vaultData';
import { useVaultLive } from './useVaultLive';
import { Collapsible } from './Collapsible';
import { Eyebrow } from './Eyebrow';
import { MonoLink } from './MonoLink';

// Literal constants so Tailwind's JIT emits the arbitrary grid-template.
// Fixed widths keep the columns aligned across the header + each row (they are
// separate grids, so `auto` would size per-row and break alignment). T3d: the
// Net APY value + header are centred (not right-aligned) so its column slack is
// split evenly — the NETWORK→NET APY and NET APY→ALLOCATION gutters read level.
const COLS = 'grid-cols-[minmax(0,1fr)_auto_92px_136px_26px]';
const LG_COLS = 'lg:grid-cols-[minmax(0,1fr)_auto_92px_136px_26px]';

// Chain (sub-vault `name`) → block-explorer address base. Used to open each
// market's contract on the right explorer via its `token_address`.
const CHAIN_ADDRESS_EXPLORER: Record<string, string> = {
  ethereum: 'https://etherscan.io/address',
  mainnet: 'https://etherscan.io/address',
  base: 'https://basescan.org/address',
  arbitrum: 'https://arbiscan.io/address',
  flow: 'https://evm.flow.com/address',
  flow_evm: 'https://evm.flow.com/address',
  'flow-evm': 'https://evm.flow.com/address',
  'flow evm': 'https://evm.flow.com/address',
  katana: 'https://katanascan.com/address',
};

/** Block-explorer URL for a market's contract, or null if chain/address unknown. */
function explorerAddressUrl(chain: string, address?: string): string | null {
  if (!address) return null;
  const base = CHAIN_ADDRESS_EXPLORER[chain?.toLowerCase().trim()];
  return base ? `${base}/${address}` : null;
}

/**
 * Map a live `sub_vault` to an allocation row, following the dapp's token-detail
 * positions accordion (apy from `apy_alltime`, weight as the AUM share, the
 * non-subvault idle-liquidity copy fallback).
 */
function subVaultToAlloc(v: SubVault): Alloc {
  const apyNum = parseFloat(v.apy_alltime) * 100;
  const apy = v.is_subvault && Number.isFinite(apyNum) ? `${apyNum.toFixed(1)}%` : '--';
  return {
    label: v.token_name,
    chain: v.name,
    apy,
    pct: parseFloat(v.weight) || 0,
    tags: v.tags ?? [],
    address: v.token_address,
    desc: v.is_subvault
      ? v.description
      : 'Idle stablecoins — held as withdrawal liquidity or during rebalancing periods.',
  };
}

/** Parse a Net APY string like "13.0%" into a number for sorting; non-numeric
 *  values ("--") sort last. */
function apyValue(apy: string): number {
  const n = parseFloat(apy);
  return Number.isFinite(n) ? n : -Infinity;
}

/**
 * "Where the yield comes from." — an allocation table where each market row
 * expands to reveal its strategy blurb and tags. Seeds from the curated content,
 * then maps the vault's live `sub_vaults` from `useVaults()` (the same source
 * the dapp's positions accordion uses). First row open by default.
 */
export function YieldSources({ token }: { token: TokenContent }) {
  const [open, setOpen] = useState(0);
  const live = useVaultLive(token.address);

  const alloc = useMemo<Alloc[]>(() => {
    const subs = live.sub_vaults;
    const rows = Array.isArray(subs) && subs.length ? subs.map(subVaultToAlloc) : token.yieldSources.alloc;
    // Rows are shown highest Net APY first, ties broken by larger allocation,
    // regardless of the order the seed or the live API returns them in.
    return [...rows].sort((a, b) => apyValue(b.apy) - apyValue(a.apy) || b.pct - a.pct);
  }, [live.sub_vaults, token.yieldSources.alloc]);

  return (
    <section className="mx-auto max-w-[1240px] px-6 py-[104px] sm:px-10">
      <Eyebrow className="mb-7">Yield sources</Eyebrow>
      {/* T1/D4: heading scale normalised to the homepage section scale. */}
      <h2 className="font-display text-[clamp(33px,6.5vw,48px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
        Where the yield <span className="text-brand">comes from.</span>
      </h2>
      <p className="mt-6 max-w-[880px] text-pretty font-sans text-[clamp(17px,1.7vw,21px)] font-light leading-[1.55]">
        {token.yieldSources.intro}
      </p>

      <div className="mt-[68px]">
        <div
          className={cn(
            'hidden items-center gap-[26px] pb-4 pl-5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/[0.38] lg:grid',
            COLS
          )}
        >
          <span>Market</span>
          <span>Network</span>
          <span className="text-center">Net APY</span>
          <span className="text-right">Allocation</span>
          <span />
        </div>

        {alloc.map((a, i) => {
          const isOpen = open === i;
          return (
            <div
              key={`${a.label}-${i}`}
              className={cn(
                'border-t border-white/10 pl-5 transition-shadow',
                isOpen && 'shadow-[inset_3px_0_0_var(--brand)]'
              )}
            >
              {/* group wraps just the header so the overlay toggle doesn't
                  cover the collapsible content below. */}
              <div className="group relative">
                {/* Full-row expand/collapse toggle sits behind the cells; every
                    cell except the external link is pointer-events-none, so
                    clicks fall through to this button. */}
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  aria-label={`Toggle ${a.label} details`}
                  className="absolute inset-0 z-0 cursor-pointer"
                />
                <div
                  className={cn(
                    'pointer-events-none relative z-10 grid grid-cols-2 items-center gap-x-[26px] gap-y-3 py-6 text-left lg:gap-[26px]',
                    LG_COLS
                  )}
                >
                  <div className="order-1 flex min-w-0 items-center gap-[10px] lg:order-none">
                    {/* T3a: row title turns brand on hover to signal expandability. */}
                    <span className="font-display text-2xl font-bold leading-none text-foreground transition-colors group-hover:text-brand">
                      {a.label}
                    </span>
                    {/* External-link icon opens the market's contract on the
                        right block explorer (via its live token_address); seeded
                        rows without an address fall back to the Directory. */}
                    <a
                      href={explorerAddressUrl(a.chain, a.address) ?? LINKS.routes.trustcenter}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${a.label} on the block explorer`}
                      className="pointer-events-auto inline-flex shrink-0 text-foreground/[0.42] transition-colors hover:text-brand"
                    >
                      <ExternalLink className="size-[14px]" />
                    </a>
                  </div>
                  <span className="order-3 inline-flex w-fit items-center whitespace-nowrap rounded-[20px] border border-white/[0.08] bg-white/[0.05] px-3 py-[5px] font-mono text-[10.5px] tracking-[0.06em] text-foreground/60 lg:order-none">
                    {a.chain}
                  </span>
                  <span className="order-2 font-display text-[26px] font-extrabold leading-none text-brand lg:order-none lg:text-center">
                    {a.apy}
                  </span>
                  <div className="order-4 lg:order-none">
                    <div className="mb-[7px] h-1 overflow-hidden rounded-[3px] bg-white/[0.08]">
                      <div className="h-full rounded-[3px] bg-brand" style={{ width: `${a.pct}%` }} />
                    </div>
                    <div className="text-right font-mono text-[11px] text-foreground/50">{a.pct}% AUM</div>
                  </div>
                  <span className="order-5 hidden text-center font-mono text-[20px] leading-none text-brand lg:block">
                    {isOpen ? '×' : '+'}
                  </span>
                </div>
              </div>
              <Collapsible open={isOpen} durationMs={450}>
                <div className="min-h-0">
                  <div className="max-w-[900px] pb-7">
                    <p className="mb-4 text-pretty font-sans text-[14.5px] font-light leading-[1.65] text-foreground/60">
                      {a.desc}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {a.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-[7px] border border-white/10 bg-white/[0.04] px-[11px] py-[6px] font-mono text-[10.5px] tracking-[0.05em] text-foreground/60"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Collapsible>
            </div>
          );
        })}
        <div className="border-t border-white/10" />
      </div>

      <MonoLink href={LINKS.routes.trustcenter} external className="mt-12">
        Inspect these markets in the Directory
      </MonoLink>
    </section>
  );
}
