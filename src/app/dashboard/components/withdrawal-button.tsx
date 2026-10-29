'use client';

import { useEffect, useRef, useState } from 'react';

interface WithdrawalButtonProps {
  /** Cooldown end timestamp in seconds (0 means no timelock — ready instantly). */
  timelockEndsAt: bigint | null;
  /** Whether a withdrawal request exists for this user / vault. */
  hasRequest: boolean;
  /** Called when the user clicks "Request Withdrawal" (no pending request). */
  onRequestClick: () => void;
  /** Called when the user clicks "Withdraw" after the cooldown expires. */
  onWithdrawClick: () => void;
  /** Text before the countdown while pending (default "Ready in"). */
  pendingLabel?: string;
  /** Total wait the countdown measures, in seconds (default 48h). */
  totalSeconds?: number;
}

function formatHMS(remaining: number) {
  const hh = String(Math.floor(remaining / 3600)).padStart(2, '0');
  const mm = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function WithdrawalButton({
  timelockEndsAt,
  hasRequest,
  onRequestClick,
  onWithdrawClick,
  pendingLabel = 'Ready in',
  totalSeconds = 48 * 3600,
}: WithdrawalButtonProps) {
  const endsAt = timelockEndsAt != null ? Number(timelockEndsAt) : 0;
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [justBecameReady, setJustBecameReady] = useState(false);
  const wasPendingRef = useRef(false);

  const isPending = hasRequest && endsAt > 0 && endsAt > now;
  const isReady = hasRequest && (endsAt === 0 || endsAt <= now);

  useEffect(() => {
    if (!isPending) return;
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, [isPending]);

  useEffect(() => {
    if (isPending) wasPendingRef.current = true;
    if (isReady && wasPendingRef.current) {
      setJustBecameReady(true);
      const t = setTimeout(() => setJustBecameReady(false), 800);
      wasPendingRef.current = false;
      return () => clearTimeout(t);
    }
  }, [isPending, isReady]);

  if (!hasRequest) {
    return (
      <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); onRequestClick(); }}>
        Request Withdrawal
      </button>
    );
  }

  if (isPending) {
    const remaining = Math.max(0, endsAt - now);
    return (
      <button className="btn wd-cd-btn wd-cd-pending" disabled onClick={(e) => e.stopPropagation()}>
        {pendingLabel} {formatHMS(remaining)}
        <div className="wd-cd-progress" style={{ width: `${progressPct(endsAt, now, totalSeconds)}%` }} />
      </button>
    );
  }

  // Ready
  return (
    <button
      className={`btn wd-cd-btn wd-cd-ready${justBecameReady ? ' wd-just-ready' : ''}`}
      onClick={(e) => { e.stopPropagation(); onWithdrawClick(); }}
    >
      Withdraw →
    </button>
  );
}

/** How far through the wait we are (start = endsAt − totalSeconds), clamped 0–100. */
function progressPct(endsAt: number, now: number, totalSeconds: number) {
  const remaining = Math.max(0, endsAt - now);
  const elapsed = Math.max(0, totalSeconds - remaining);
  return Math.min(100, (elapsed / totalSeconds) * 100);
}
