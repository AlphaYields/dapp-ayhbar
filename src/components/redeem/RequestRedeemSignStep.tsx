'use client';

import { TxCard } from '@/components/deposit/TxCard';

interface RequestRedeemSignStepProps {
  active: boolean;
  done: boolean;
  txHash: `0x${string}` | null;
  explorerBase: string;
}

export function RequestRedeemSignStep({ active, done, txHash, explorerBase }: RequestRedeemSignStepProps) {
  return (
    <>
      <div className="dep-step-title" style={{ marginBottom: 16 }}>
        Sign request
      </div>
      <div className="dep-tx-list">
        <TxCard
          num={1}
          title="Sign request"
          description="Sign the withdrawal request in your wallet to queue your position."
          alwaysShowDescription
          active={active}
          done={done}
          showSpinner={active}
        >
          {done && txHash && (
            <a href={`${explorerBase}/${txHash}`} target="_blank" rel="noopener noreferrer" className="dep-tx-link">
              View transaction ↗
            </a>
          )}
        </TxCard>
      </div>
    </>
  );
}
