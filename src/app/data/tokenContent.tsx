/**
 * ayHBAR detail-page content + types — verbatim from the design
 * (`AlphaYields ayHBAR.dc.html`). Headline
 * stats (APY, share price, drawdown, since-inception) are seeded from these
 * constants, then refreshed live via `useVaultLive` (D2/D32). TVL has no field
 * on `/api/vaultdata`, so it stays seeded here. Authored as `.tsx` because a few
 * blurbs emphasize words inline.
 */
import type { ReactNode } from 'react';
import { VAULTS, type VaultSymbol } from './vaults.config';

/** One configurable timeframe of the share-price performance chart. */
export type ChartFrame = {
  key: '7D' | '1M' | '3M' | 'ALL';
  /** Headline label, e.g. "30-Day APY". */
  label: string;
  /** Seed APY string for this frame, e.g. "10.2%". */
  apy: string;
  /** Which live API field overrides `apy` (null → keep seed). */
  live: 'apy_7d' | 'apy_1m' | 'apy_3m' | 'apy' | null;
  /** Synthetic-curve params (marketing visual). */
  start: number;
  end: number;
  lin: number;
  amp: number;
  freq: number;
  phase: number;
  /** X-axis tick labels. */
  xs: string[];
};

export type Step = { num: string; title: string; desc: string };
export type Alloc = {
  label: string;
  chain: string;
  apy: string;
  pct: number;
  tags: string[];
  desc: string;
  /** Live sub-vault contract address (for the block-explorer link); absent on
   *  the seeded rows, which fall back to the Directory. */
  address?: string;
};
export type Risk = { num: string; title: string; body: string };
export type Faq = { question: string; answer: string };
export type Tx = { title: string; date: string; count: number };

export type TokenContent = {
  symbol: VaultSymbol;
  /** On-chain vault address (live APY lookup). */
  address: `0x${string}`;
  /** Denomination unit shown in the buy box / share price, e.g. "PYUSD". */
  unit: string;
  /** Share-price decimal places. */
  dp: number;
  /** Small circular badge glyph next to the icon ("$" / "↻"). */
  badge: string;
  /**
   * Minting is not wired for this vault yet — every mint/deposit CTA renders
   * inert instead of opening the deposit modal. Read-only data (APY, share
   * price, activity log) still hydrates normally.
   */
  mintDisabled?: boolean;

  hero: {
    eyebrow: string;
    /** Paragraph with the symbol emphasized inline. */
    blurb: ReactNode;
    denomination: string;
    methodology: string;
    netApy: string;
    /** Overrides the "Net APY" stat label (e.g. "Target APY" pre-launch). */
    apyLabel?: string;
    /** Overrides the "Methodology" stat label. */
    methodologyLabel?: string;
  };
  buyBox: {
    /** e.g. "1.061" — formatted into "1 ayUSD = 1.061 PYUSD". */
    sharePrice: string;
    netApy: string;
    maxDrawdown: string;
    mintLabel: string;
    /** Overrides the "1 ayX = price UNIT" line under the symbol. */
    subline?: string;
    /** Overrides the "Net APY" row label. */
    apyLabel?: string;
    /** Replace the max-drawdown row with these label/value rows. */
    rows?: [string, string][];
  };
  perf: {
    tvl: string;
    tvlSub: string;
    sinceInception: string;
    frames: ChartFrame[];
  };
  overview: { headingSuffix: string; body: ReactNode };
  steps: Step[];
  yieldSources: { intro: ReactNode; alloc: Alloc[] };
  transparency: {
    body: string;
    quote: string;
    /** Populated rows render the ledger card; empty → "No transactions yet". */
    txs: Tx[];
  };
  riskIntro: ReactNode;
  risks: Risk[];
  faqs: Faq[];
  finalCta: { headline: string; sub: string };
};

/** Inline brighter emphasis used inside design paragraphs. */
function Em({ children }: { children: React.ReactNode }) {
  return <span className="font-normal text-foreground">{children}</span>;
}

/**
 * ayHBAR — ported from the design (`AlphaYields ayHBAR.dc.html`). Live vault on
 * Hedera (see `vaults.config`); APY, share price and NAV come from `useVaultLive`.
 * Share price is in HBARX, the vault's denomination token.
 *
 * #TODO: sign-off on the remaining design copy (target APY, leverage, buy-box rows).
 */
export const AYHBAR: TokenContent = {
  symbol: 'ayHBAR',
  address: VAULTS.ayHBAR.address,
  unit: 'HBARX',
  dp: 4,
  badge: 'ℏ',
  hero: {
    eyebrow: 'Leveraged HBAR staking on Hedera',
    blurb: (
      <>
        HBAR staked into HBARX, posted as collateral, borrowed against and staked again — each turn captures the gap
        between what staking pays and what borrowing costs. No derivatives, no counterparty, earned in HBAR.
      </>
    ),
    denomination: 'HBARX',
    methodology: 'ERC-4626',
    methodologyLabel: 'Vault standard',
    netApy: '10.63%',
    apyLabel: 'Target APY',
  },
  buyBox: {
    sharePrice: '1.029',
    netApy: '10.63%',
    maxDrawdown: '—',
    mintLabel: 'Mint ayHBAR',
    subline: '1 HBARX = 1.43563 HBAR',
    apyLabel: 'Target APY · 2.70×',
    rows: [
      ['Base staking yield', '5.86%'],
      ['Deposit', 'HBAR or HBARX'],
    ],
  },
  perf: {
    tvl: '$0.42M',
    tvlSub: '2.38M HBAR',
    sinceInception: '+2.92% since inception',
    frames: [
      {
        key: '7D',
        label: '7-Day APY',
        apy: '10.4%',
        live: 'apy_7d',
        start: 1.0272,
        end: 1.0292,
        lin: 0.9,
        amp: 0.01,
        freq: 5.5,
        phase: 0.3,
        xs: ['Oct 2', 'Oct 4', 'Oct 6', 'Oct 9'],
      },
      {
        key: '1M',
        label: '30-Day APY',
        apy: '10.1%',
        live: 'apy_1m',
        start: 1.0208,
        end: 1.0292,
        lin: 0.92,
        amp: 0.01,
        freq: 7.5,
        phase: 0.0,
        xs: ['Sep 9', 'Sep 14', 'Sep 19', 'Sep 24', 'Sep 29', 'Oct 4', 'Oct 9'],
      },
      {
        key: '3M',
        label: '90-Day APY',
        apy: '9.8%',
        live: 'apy_3m',
        start: 1.006,
        end: 1.0292,
        lin: 0.9,
        amp: 0.01,
        freq: 4.5,
        phase: 1.4,
        xs: ['Jul 11', 'Jul 31', 'Aug 20', 'Sep 9', 'Oct 9'],
      },
      {
        key: 'ALL',
        label: 'All-Time APY',
        apy: '9.6%',
        live: 'apy',
        start: 1.0,
        end: 1.0292,
        lin: 0.88,
        amp: 0.01,
        freq: 9.5,
        phase: 2.2,
        xs: ['Jun 29', 'Jul', 'Aug', 'Sep', 'Oct'],
      },
    ],
  },
  overview: {
    headingSuffix: 'ayHBAR',
    body: (
      <>
        <Em>ayHBAR</Em> turns HBAR into a yield-bearing position and amplifies it. Deposited HBAR is staked through
        Stader into HBARX, which earns Hedera staking rewards. That HBARX is supplied as collateral, HBAR is borrowed
        against it and staked again. Collateral and debt are both HBAR-denominated, so the loop scales the yield — not
        the market risk. You end the year holding more HBAR than you started with.
      </>
    ),
  },
  steps: [
    {
      num: '01',
      title: 'Stake',
      desc: 'HBAR is staked through Stader into HBARX, a rate-appreciating liquid staking token.',
    },
    {
      num: '02',
      title: 'Collateralise',
      desc: 'HBARX is supplied to the Hedera lending market as collateral.',
    },
    {
      num: '03',
      title: 'Borrow & restake',
      desc: 'HBAR is borrowed against it and staked again, adding to the position.',
    },
    {
      num: '04',
      title: 'Repeat',
      desc: 'Each turn earns the spread between staking yield and borrow cost.',
    },
  ],
  yieldSources: {
    intro: (
      <>
        <Em>Every rate is read from Hedera mainnet contracts — Stader HBARX staking and the Hedera lending market —</Em>{' '}
        <span className="text-foreground/50">
          not advertised. Leverage is bounded by HBARX&apos;s 62.98% collateral factor and held below the 68.28%
          liquidation threshold.
        </span>
      </>
    ),
    alloc: [
      {
        label: 'HBARX looped staking',
        chain: 'Hedera',
        apy: '10.07%',
        pct: 82,
        tags: ['Liquid staking', 'HBARX', 'Stader', 'Leverage'],
        desc: 'The core loop — HBAR staked through Stader into HBARX, supplied as collateral on the Hedera lending market, HBAR borrowed at ~3.06% and staked again. Run at ~2.5×, below the 2.70× ceiling, each turn earning the +2.80 pp spread again.',
      },
      {
        label: 'HBARX base staking',
        chain: 'Hedera',
        apy: '5.86%',
        pct: 13,
        tags: ['Liquid staking', 'HBARX', 'Unlevered'],
        desc: 'Unlevered HBARX held as the base of the position. Its exchange rate rose in every one of 50 observations across 102 days — rewards accrue into the rate rather than being paid out.',
      },
      {
        label: 'Buffer & liquidity',
        chain: 'Hedera',
        apy: '5.86%',
        pct: 5,
        tags: ['Liquidity', 'Reserve', 'HBARX'],
        desc: 'An HBARX reserve held outside the loop so redemptions can be paid without unwinding leverage.',
      },
    ],
  },
  transparency: {
    body: "Every stake, borrow, and rebalance is recorded on Hedera and verifiable by anyone. No black boxes — the engine's decision log is public, permanent, and auditable in real time.",
    quote:
      "Every allocation is logged on-chain and verifiable at every step. If the engine makes a decision, it's there forever.",
    txs: [],
  },
  riskIntro: (
    <>No yield is risk-free. ayHBAR runs a leveraged loop — here is what it is exposed to and how it&apos;s bounded.</>
  ),
  risks: [
    {
      num: '01',
      title: 'Market exposure.',
      body: 'The position is HBAR-denominated. Yield is earned in HBAR; its value in other currencies moves with the market.',
    },
    {
      num: '02',
      title: 'Spread compression.',
      body: 'Returns depend on borrowing costing less than staking pays. If that narrows, leverage is reduced and the position reverts toward the unlevered 5.86%.',
    },
    {
      num: '03',
      title: 'Leverage and liquidation.',
      body: 'Levered positions are managed against the 68.28% liquidation threshold with a deliberate buffer, and can be unwound at any time.',
    },
    {
      num: '04',
      title: 'Liquidity on exit.',
      body: 'Redeeming HBARX for HBAR goes through the staking queue or a market swap; large exits are best staged.',
    },
    {
      num: '05',
      title: 'Lending market dependency.',
      body: 'Leverage requires an active lending market. The vault earns the base staking yield regardless, and levers only when conditions support it.',
    },
  ],
  faqs: [
    {
      question: 'Is ayHBAR a stablecoin?',
      answer:
        'No. ayHBAR is HBAR-denominated — it grows in HBAR terms rather than holding a dollar peg. Its share price starts at 1.00 and rises as the strategy earns.',
    },
    {
      question: 'How is the yield generated?',
      answer:
        'HBAR is staked into HBARX, which earns Hedera staking rewards (5.86% realised). HBARX is used as collateral to borrow HBAR at ~3.06%, which is staked again. Each turn of leverage earns the +2.80 pp spread again. There is no derivatives position and no counterparty.',
    },
    {
      question: 'Does leverage add price risk?',
      answer:
        'No beyond your deposit. Collateral and debt are both HBAR-denominated, so the loop scales the yield, not the market exposure.',
    },
    {
      question: 'What if borrowing gets more expensive?',
      answer:
        'The strategy stays additive while borrowing costs less than staking pays. At 5.00% borrow, net yield at 2.70× is still 7.32%. Above 5.86%, leverage is reduced and the vault reverts to the unlevered staking yield.',
    },
    {
      question: 'What can I deposit and withdraw?',
      answer:
        'Deposit native HBAR or HBARX. Native HBAR is staked through Stader at the protocol rate inside the same transaction, with no swap slippage. Withdrawals pay out in HBARX — on Hedera, your account must associate HBARX before it can receive it.',
    },
  ],
  finalCta: {
    headline: 'Hold ayHBAR.',
    sub: 'Earn more HBAR from the HBAR you already hold — staked, levered, and accounted for on-chain.',
  },
};

export const TOKEN_CONTENT: Record<string, TokenContent> = {
  ayHBAR: AYHBAR,
};
