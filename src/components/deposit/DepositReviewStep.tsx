'use client'

interface DepositReviewStepProps {
  tokenOutName: string
  selectedTokenSymbol?: string
  num: number
  address?: string
  previewShares: bigint | null
  formatShares: (shares: bigint) => string
  apyDisplay: string
  /** Chain the deposit settles on (e.g. "Flow EVM", "Katana"). */
  networkName?: string
  onConfirm: () => void
  onBack: () => void
  inline?: boolean
}

export function DepositReviewStep({
  tokenOutName, selectedTokenSymbol, num, address,
  previewShares, formatShares, apyDisplay, onConfirm, onBack, inline,
  networkName = '--',
}: DepositReviewStepProps) {
  return (
    <>
      <div className="dep-step-title">Ready to deposit.</div>
      <div className="dep-step-sub">Check the details below, then confirm in your wallet.</div>

      <div className="dep-review-card">
        <div className="dep-rrow">
          <span className="dep-rk">Strategy</span>
          <span className="dep-rv">{tokenOutName}</span>
        </div>
        <div className="dep-rrow">
          <span className="dep-rk">Network</span>
          <span className="dep-rv">{networkName}</span>
        </div>
        <div className="dep-rrow">
          <span className="dep-rk">You send</span>
          <span className="dep-rv dep-rv-big">{num.toLocaleString()} {selectedTokenSymbol ?? ''}</span>
        </div>
        <div className="dep-rrow">
          <span className="dep-rk">You receive</span>
          <span className="dep-rv dep-rv-big dep-rv-green">
            ~{previewShares ? formatShares(previewShares) : num.toLocaleString()} {tokenOutName}
          </span>
        </div>
        <div className="dep-rrow">
          <span className="dep-rk">Current APY</span>
          <span className="dep-rv dep-rv-green dep-rv-mono">{apyDisplay}%</span>
        </div>
        {address && (
          <div className="dep-rrow">
            <span className="dep-rk">Wallet</span>
            <span className="dep-rv dep-rv-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
          </div>
        )}
      </div>

      <button
        onClick={onConfirm}
        className="btn btn-green"
        style={{
          width: '100%', justifyContent: 'center',
          padding: '14px 20px', fontSize: '14px', borderRadius: '11px', marginBottom: '8px',
        }}
      >
        Confirm &amp; Continue →
      </button>
      {inline && (
        <button
          onClick={onBack}
          style={{
            width: '100%', padding: '10px', borderRadius: '8px',
            border: 'none', background: 'transparent',
            color: 'var(--muted)', fontSize: '13px', cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ← Back
        </button>
      )}
      <div className="dep-notice">Gas fees apply on-chain.</div>
    </>
  )
}
