'use client';

interface RequestRedeemQueuedStepProps {
  arriveLabel: string;
  txHash: `0x${string}` | null;
  explorerBase: string;
  onDashboard: () => void;
}

export function RequestRedeemQueuedStep({
  arriveLabel,
  txHash,
  explorerBase,
  onDashboard,
}: RequestRedeemQueuedStepProps) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
      <div className="dep-suc-icon">✓</div>
      <div className="dep-suc-title">Withdrawal queued.</div>
      <div className="dep-suc-sub" style={{ marginBottom: 8 }}>{arriveLabel}</div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--muted)',
          lineHeight: 1.65,
          marginBottom: 22,
          maxWidth: 320,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        Track the countdown on your dashboard. We&apos;ll process your position at the optimal time.
      </div>

      {txHash && (
        <div
          style={{
            background: '#2e2f33',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 22,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Transaction</div>
          <a
            href={`${explorerBase}/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: 'rgba(166,237,69,.7)', fontFamily: 'monospace', textDecoration: 'none' }}
          >
            {txHash.slice(0, 10)}...{txHash.slice(-6)} ↗
          </a>
        </div>
      )}

      <button
        onClick={onDashboard}
        className="btn btn-green"
        style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: '12px', fontSize: '14px' }}
      >
        View Dashboard →
      </button>
    </div>
  );
}
