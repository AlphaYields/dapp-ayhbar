'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

/**
 * Info icon next to a row's APY that pops a Staking / AY strategies / Compounded APY
 * breakdown. The parts compound, so they don't sum to the total. Portalled with fixed positioning because the row card is
 * `overflow-hidden` and would clip an in-flow popover.
 */
export function ApyBreakdown({
  staking,
  net,
  className,
}: {
  staking: number;
  net: number;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; arrow: number } | null>(null);

  // ponytail: position is captured on open only; it won't follow a scroll while
  // open. Swap for a positioning lib if this ever needs to stay pinned.
  const show = () => {
    // Anchor on the parent (APY value + icon) so the arrow points at the value.
    const r = ref.current?.parentElement?.getBoundingClientRect();
    if (!r) return;
    const target = r.left + 14;
    // Clamp so the 226px card stays on screen (APY sits at the right edge on mobile).
    const left = Math.max(8, Math.min(target - 26, window.innerWidth - 234));
    setPos({ left, top: r.bottom + 13, arrow: Math.min(target - left, 208) });
  };
  const hide = () => setPos(null);

  // Inverse of net = (1 + staking)(1 + strategies) - 1.
  const strategies = ((100 + net) / (100 + staking) - 1) * 100;
  const rows: [string, number, boolean][] = [
    ['Staking APY', staking, false],
    ['AY strategies APY', strategies, false],
    ['Compounded APY', net, true],
  ];

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label="APY breakdown"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        // translate-y: Darker Grotesque digits sit ~2.5px below their line-box centre.
        className={cn(
          'inline-flex shrink-0 translate-y-[2.5px] cursor-pointer bg-transparent transition-colors',
          pos ? 'text-brand' : 'text-foreground/50',
          className
        )}
      >
        {/* SVG rather than a text "i": a font glyph never centres in a 16px circle. */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden>
          <circle cx="8" cy="8" r="7.5" strokeOpacity={pos ? 1 : 0.56} />
          <path d="M8 7.25v4" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="4.75" r=".9" fill="currentColor" stroke="none" />
        </svg>
      </button>
      {pos &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[9999] w-[226px] rounded-[12px] border border-brand/[0.38] bg-surface px-[15px] pb-[14px] pt-[13px] shadow-[0_16px_44px_rgba(0,0,0,0.6)]"
            style={{ left: pos.left, top: pos.top }}
          >
            <span
              className="absolute -top-[5px] size-2 -translate-x-1/2 rotate-45 border-l border-t border-brand/[0.38] bg-surface"
              style={{ left: pos.arrow }}
            />
            {rows.map(([label, value, net]) => (
              <div
                key={label}
                className={cn(
                  'flex items-center justify-between gap-[14px]',
                  net ? 'mt-[9px] border-t border-white/10 pt-[10px]' : 'py-1'
                )}
              >
                <span className="whitespace-nowrap font-sans text-[12.5px] font-light text-foreground/60">
                  {label}
                </span>
                <span
                  className={cn(
                    'font-mono font-semibold',
                    net ? 'text-[13.5px] text-brand' : 'text-[12.5px] text-foreground'
                  )}
                >
                  {value.toFixed(1)}%
                </span>
              </div>
            ))}
            <p className="mt-[8px] font-sans text-[11px] font-light leading-[1.35] text-foreground/45">
              Components are compounded:<br />(1 + Staking) × (1 + Strategies) − 1
            </p>
          </div>,
          document.body
        )}
    </>
  );
}
