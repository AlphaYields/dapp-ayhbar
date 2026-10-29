'use client';

import { useState } from 'react';
import { TokenId } from '@/types/static';
import { AYHBAR } from '@/app/data/tokenContent';
import { DepositModal } from '@/components/deposit-modal';
import { FooterCompact } from '@/components/footer-compact';
import { TokenHero } from '../_components/TokenHero';
import { PerformancePanel } from '../_components/PerformancePanel';
import { TokenOverview } from '../_components/TokenOverview';
import { HowItWorks } from '../_components/HowItWorks';
import { YieldSources } from '../_components/YieldSources';
import { TokenTransparency } from '../_components/TokenTransparency';
import { TokenRisk } from '../_components/TokenRisk';
import { TokenFaq } from '../_components/TokenFaq';
import { TokenFinalCta } from '../_components/TokenFinalCta';

/**
 * /aytokens/ayhbar — ayHBAR detail page (Hedera). Headline stats hydrate live
 * from the accounting API by vault address. Mint CTAs open the DepositModal
 * (HBAR or HBARX in, see `lib/hbar/vault.ts`).
 */
export default function AyHbarPage() {
  const [depositOpen, setDepositOpen] = useState(false);
  const openDeposit = () => setDepositOpen(true);

  return (
    <>
      <main className="bg-[#16171A] font-sans text-foreground">
        <TokenHero token={AYHBAR} onMint={openDeposit} />
        <PerformancePanel token={AYHBAR} />
        <TokenOverview token={AYHBAR} />
        <HowItWorks token={AYHBAR} />
        <YieldSources token={AYHBAR} />
        <TokenTransparency token={AYHBAR} />
        <TokenRisk token={AYHBAR} />
        <TokenFaq token={AYHBAR} />
        <TokenFinalCta token={AYHBAR} onMint={openDeposit} />
      </main>
      <FooterCompact />
      {depositOpen && (
        <DepositModal
          open={depositOpen}
          defaultToken={TokenId.AYHBAR}
          onOpenChange={(open) => {
            if (!open) setDepositOpen(false);
          }}
        />
      )}
    </>
  );
}
