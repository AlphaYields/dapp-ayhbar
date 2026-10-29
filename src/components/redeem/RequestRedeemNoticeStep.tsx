'use client';

interface RequestRedeemNoticeStepProps {
  waitLabel: string;
  waitDesc: string;
  onContinue: () => void;
}

export function RequestRedeemNoticeStep({ waitLabel, waitDesc, onContinue }: RequestRedeemNoticeStepProps) {
  return (
    <>
      <div className="wd-notice-headline">Before you withdraw.</div>
      <div className="wd-info-block">
        <div className="wd-info-icon">🕐</div>
        <div>
          <div className="wd-info-title">{waitLabel}</div>
          <div className="wd-info-desc">{waitDesc}</div>
        </div>
      </div>
      <div className="wd-info-note">
        In the future, ayTokens will be tradeable on the open market — giving you instant liquidity without waiting.
      </div>
      <button
        onClick={onContinue}
        className="btn btn-green"
        style={{
          width: '100%',
          justifyContent: 'center',
          padding: '12px',
          fontSize: '14px',
          borderRadius: '8px',
          marginTop: '8px',
        }}
      >
        Continue →
      </button>
    </>
  );
}
