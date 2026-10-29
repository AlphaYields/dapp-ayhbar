'use client';

import { useEffect, useState } from 'react';
import { TxCard } from './TxCard';

interface PollStatus {
  fulfilled: boolean;
  finalized: boolean;
  refunded: boolean;
}

type WalletStepId = 'wallet_ready' | 'approving' | 'depositing' | 'submitted' | 'polling';

export interface PreStep {
  id: string;
  title: string;
  description: string;
}

interface DepositWalletStepProps {
  /** A `WalletStepId` or the id of one of `preSteps`. */
  step: WalletStepId | (string & {});
  depositTokenSymbol?: string;
  /** Cards shown before "Confirm deposit", in order. Default: one "Approve spending" card. */
  preSteps?: PreStep[];
  isBridging: boolean;
  pollStatus: PollStatus | null;
  txHash: `0x${string}` | null;
  explorerBase: string;
  referralStep: 'none' | 'loading' | 'success' | 'queued';
  referralCode: string | null;
  hasReferral?: boolean;
  onStart: () => void;
  onBack: () => void;
  inline?: boolean;
}

export function DepositWalletStep({
  step,
  depositTokenSymbol,
  preSteps = [
    {
      id: 'approving',
      title: 'Approve spending',
      description: `Lets the vault take exactly this amount of ${depositTokenSymbol ?? 'token'} — nothing more. You'll sign this before each deposit.`,
    },
  ],
  isBridging,
  pollStatus,
  txHash,
  explorerBase,
  referralStep,
  referralCode,
  hasReferral,
  onStart,
  onBack,
  inline,
}: DepositWalletStepProps) {
  const walletIdle = step === 'wallet_ready';
  // Cards complete in order: every card before the current step is done.
  const order = [...preSteps.map((p) => p.id), 'depositing', 'submitted'];
  const cur = order.indexOf(step === 'polling' ? 'submitted' : step);
  const depositIdx = preSteps.length;
  const card2Active = step === 'depositing';
  const card2Done = cur > depositIdx;
  const card3Visible = step === 'polling' || step === 'submitted';

  const [card3Ready, setCard3Ready] = useState(false);

  useEffect(() => {
    if (!card3Visible) {
      setCard3Ready(false);
      return;
    }
    const t = setTimeout(() => setCard3Ready(true), 3000);
    return () => clearTimeout(t);
  }, [card3Visible]);

  const card3Active = card3Visible && !card3Ready;
  const card3Done = card3Visible && card3Ready;

  return (
    <>
      <div className="dep-step-title" style={{ marginBottom: 16 }}>
        Sign in your wallet
      </div>

      <div className="dep-tx-list">
        {preSteps.map((p, i) => (
          <TxCard
            key={p.id}
            num={i + 1}
            title={p.title}
            description={p.description}
            alwaysShowDescription
            active={step === p.id}
            done={cur > i}
            showSpinner={step === p.id}
          />
        ))}

        <TxCard
          num={depositIdx + 1}
          title="Confirm deposit"
          description="Sign the deposit transaction in your wallet."
          active={card2Active}
          done={card2Done}
          showSpinner={card2Active}
        />

        <TxCard
          num={depositIdx + 2}
          title="Transaction submitted"
          description="Your transaction has been broadcast to the network."
          active={card3Active}
          done={card3Done}
          showSpinner={card3Active}
        >
          {card3Visible && card3Ready && (
            <>
              {pollStatus && (
                <div style={{ fontSize: 11, color: '#A6ED45', marginTop: 4 }}>
                  {pollStatus.fulfilled
                    ? 'Fulfilled'
                    : pollStatus.finalized
                      ? 'Finalizing...'
                      : 'Waiting for confirmation...'}
                </div>
              )}
              {txHash && (
                <a href={`${explorerBase}/${txHash}`} target="_blank" rel="noopener noreferrer" className="dep-tx-link">
                  View transaction ↗
                </a>
              )}
            </>
          )}
        </TxCard>

        {hasReferral && (
          <TxCard
            num={depositIdx + 3}
            title="Referral confirmation"
            description={
              referralStep === 'loading'
                ? 'Confirming your referral...'
                : referralStep === 'queued'
                  ? "Queued — we'll retry in the background."
                  : undefined
            }
            active={referralStep === 'loading'}
            done={referralStep === 'success' || referralStep === 'queued'}
            showSpinner={referralStep === 'loading'}
          >
            {referralStep === 'success' && (
              <div className="dep-tx-desc">
                Referral confirmed!
                {referralCode && (
                  <>
                    {' '}
                    Code: <span style={{ color: '#A6ED45' }}>{referralCode}</span>
                  </>
                )}
              </div>
            )}
          </TxCard>
        )}
      </div>

      {walletIdle && (
        <>
          <button
            onClick={onStart}
            className="btn btn-green"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '14px 20px',
              fontSize: '14px',
              borderRadius: '11px',
              marginTop: '4px',
            }}
          >
            Start →
          </button>
          {inline && (
            <button
              onClick={onBack}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: 'var(--muted)',
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                marginTop: '4px',
              }}
            >
              ← Back
            </button>
          )}
        </>
      )}
    </>
  );
}
