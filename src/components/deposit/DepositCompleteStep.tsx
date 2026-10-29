'use client';

interface DepositCompleteStepProps {
  txHash: `0x${string}` | null;
  explorerBase: string;
  referralCode?: string | null;
  /** Extra line under the success copy (e.g. withdrawal cooldown notice). */
  note?: string;
  onReset: () => void;
  onDashboard: () => void;
}

export function DepositCompleteStep({
  txHash,
  explorerBase,
  referralCode,
  note,
  onReset,
  onDashboard,
}: DepositCompleteStepProps) {
  return (
    <div style={{ textAlign: 'center', padding: '28px 8px 8px' }}>
      <div className="dep-suc-icon">✓</div>
      <div className="dep-suc-title">You&apos;re in.</div>
      <div className="dep-suc-sub">
        Your position is being confirmed on-chain. It&apos;ll appear in your dashboard within ~30 seconds.
      </div>
      {note && (
        <div
          style={{
            fontSize: 11.5,
            color: 'rgba(138, 139, 145, 0.5)',
            fontStyle: 'italic',
            lineHeight: 1.65,
            marginBottom: 16,
          }}
        >
          {note}
        </div>
      )}

      {txHash && (
        <div
          style={{
            background: '#131417',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12,
            padding: '13px 16px',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 9.5,
              fontWeight: 600,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              color: 'rgba(244,245,242,0.4)',
              marginBottom: 5,
            }}
          >
            Transaction
          </div>
          <a
            href={`${explorerBase}/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 12,
              color: 'rgba(166,237,69,.75)',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              textDecoration: 'none',
            }}
          >
            {txHash.slice(0, 10)}...{txHash.slice(-6)} ↗
          </a>
        </div>
      )}

      {referralCode && (
        <div
          style={{
            background: 'rgba(166,237,69,0.06)',
            border: '1px solid rgba(166,237,69,0.2)',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Your referral confirmation</div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#A6ED45',
              fontFamily: 'monospace',
              letterSpacing: '0.05em',
            }}
          >
            {referralCode}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button
          onClick={onReset}
          className="btn btn-outline"
          style={{ justifyContent: 'center', padding: '13px 18px', borderRadius: '11px', fontSize: '13.5px' }}
        >
          Deposit More
        </button>
        <button
          onClick={onDashboard}
          className="btn btn-green"
          style={{ justifyContent: 'center', padding: '13px 18px', borderRadius: '11px', fontSize: '13.5px' }}
        >
          View Dashboard
        </button>
      </div>
    </div>
  );
}
