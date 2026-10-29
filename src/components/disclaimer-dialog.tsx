'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface DisclaimerDialogProps {
  open: boolean
  address?: `0x${string}` | null
  onAgree: () => void
  onCancel: () => void
}

const TERMS_URL = 'https://alphayields.ai/docs/terms'

/**
 * Deposit-flow disclaimer gate — restyled to
 * `Disclaimer-Cookiepolicy-popups.html` (audit-fixes, D1: restyle only, still a
 * deposit-flow gate). Green modal, lime accents, reference `.ay-scroll`
 * scrollbar. Functional behaviour (localStorage + /api/disclaimer-accept +
 * agree gate) is unchanged. Kept 1:1 with the landing.
 */
export function DisclaimerDialog({ open, address, onAgree, onCancel }: DisclaimerDialogProps) {
  const [agreed, setAgreed] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) setAgreed(false)
  }, [open])

  // The deposit modal's Radix Dialog installs a document-level non-passive
  // wheel/touchmove blocker (react-remove-scroll, bubble phase). Because this
  // disclaimer is portaled to <body> — outside Radix's lock element — that
  // blocker cancels scrolling inside the legal text. Stop the events at the
  // scroll container so they never reach the document listener; native
  // scrolling then works (we don't preventDefault, so the container scrolls).
  useEffect(() => {
    if (!open) return
    const el = scrollRef.current
    if (!el) return
    const stop = (e: Event) => e.stopPropagation()
    el.addEventListener('wheel', stop, { passive: true })
    el.addEventListener('touchmove', stop, { passive: true })
    return () => {
      el.removeEventListener('wheel', stop)
      el.removeEventListener('touchmove', stop)
    }
  }, [open])

  // Portal to <body> so the fixed overlay escapes the deposit modal's Radix
  // DialogContent (its translate(-50%) transform makes `position: fixed`
  // resolve against the modal box → the disclaimer was narrowed + clipped).
  // `open` is false on the server, so this returns before touching `document`.
  if (!open || typeof document === 'undefined') return null

  const handleAgree = () => {
    const payload = { address: address ?? 'not_connected', timestamp: new Date().toISOString() }
    try {
      localStorage.setItem('ay_disclaimer_accepted', JSON.stringify(payload))
    } catch { /* ignore */ }
    fetch('/api/disclaimer-accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => { })
    onAgree()
  }

  const heading: React.CSSProperties = { margin: '0 0 8px', fontSize: 14.5, fontWeight: 600, color: '#F7F7F7' }
  const para: React.CSSProperties = { margin: '0 0 22px' }

  return createPortal(
    <div
      data-disclaimer
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
      style={{
        // Max int — above the deposit modal (Radix z-50), the nav drawer
        // (z-301) and RainbowKit's portal, so the gate is always on top.
        position: 'fixed', inset: 0, zIndex: 2147483647,
        // Radix modal sets body { pointer-events: none } while the deposit modal
        // is open; re-enable it for this body-portaled overlay.
        pointerEvents: 'auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 22,
        background: 'rgba(0,0,0,0.85)',
        animation: 'ay-fade-in .3s ease both',
        fontFamily: 'var(--font-poppins), sans-serif',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 620, maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          background: '#0d1a0d',
          border: '1px solid rgba(166,237,69,0.45)',
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          animation: 'ay-modalbox-in .35s ease both',
        }}
      >
        <div style={{ padding: '26px clamp(22px, 4vw, 34px) 16px', borderBottom: '1px solid rgba(247,247,247,0.07)' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-poppins), sans-serif', fontWeight: 700, fontSize: 'clamp(1.15rem, 3vw, 1.35rem)', letterSpacing: '-0.01em', color: '#F7F7F7' }}>
            Disclaimer
          </h2>
        </div>

        <div
          ref={scrollRef}
          className="ay-scroll"
          style={{
            overflowY: 'auto', maxHeight: '60vh',
            padding: '22px clamp(22px, 4vw, 34px)',
            fontSize: 13.5, lineHeight: 1.7, fontWeight: 300, color: 'rgba(247,247,247,0.78)',
          }}
        >
          <h3 style={heading}>1. Informational nature and no advice</h3>
          <p style={para}>The content made available on the Website is for information purposes only and does not constitute financial, legal, tax advice or an investment recommendation. Legal references: Decree-Law No. 57/2008 (clarity; prohibition of misleading statements); Decree-Law No. 7/2004 (online communications).</p>

          <h3 style={heading}>2. Express statement of risk</h3>
          <p style={para}>Crypto-assets and DeFi strategies involve high risk, including volatility and the possibility of total loss. Any reference to returns is indicative only and does not guarantee future results. Legal references: Decree-Law No. 57/2008 (material information; omissions); Decree-Law No. 446/85 (transparency of standard terms).</p>

          <h3 style={heading}>3. Legal limits of exclusion/limitation of liability</h3>
          <p style={para}>To the maximum extent permitted by law, AlphaYields accepts no liability for losses arising from the user&apos;s decisions, market conditions or failures of third parties (protocols, networks, bridges, oracles and smart contracts), without prejudice to liability that cannot be excluded by operation of law. Legal references: Civil Code (civil liability – Articles 483 et seq.); Decree-Law No. 446/85 (unfair terms and limits); mandatory consumer law, where applicable.</p>

          <h3 style={heading}>4. Supplementary documents</h3>
          <p style={{ margin: 0 }}>
            This disclaimer must be read together with the{' '}
            <a className="ay-legal-link" href={TERMS_URL} target="_blank" rel="noopener noreferrer">Terms of Use</a>{' '}
            and risk materials (including the{' '}
            {/* TODO: Real Link/Data Needed — whitepaper deep link */}
            <a className="ay-legal-link" href="#">whitepaper</a>). Legal references: Decree-Law No. 57/2008 (completeness of information); Decree-Law No. 446/85 (communication and contractual incorporation).
          </p>
        </div>

        <div style={{ padding: '18px clamp(22px, 4vw, 34px) 22px', borderTop: '1px solid rgba(247,247,247,0.07)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 400, color: 'rgba(247,247,247,0.45)' }}>Last updated: 08/03/2026</p>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 11, cursor: 'pointer', fontSize: 13.5, lineHeight: 1.5, color: 'rgba(247,247,247,0.85)' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ flex: '0 0 auto', width: 18, height: 18, marginTop: 1, accentColor: '#A6ED45', cursor: 'pointer' }}
            />
            <span>
              I have read and agree to the{' '}
              <a className="ay-legal-link" href={TERMS_URL} target="_blank" rel="noopener noreferrer">Terms of Use</a>{' '}
              and Disclaimer
            </span>
          </label>
          <button
            type="button"
            disabled={!agreed}
            onClick={handleAgree}
            style={{
              alignSelf: 'flex-end', height: 46, padding: '0 28px',
              fontFamily: 'var(--font-poppins), sans-serif', fontSize: 14.5, fontWeight: 600,
              color: '#0E1311', background: '#A6ED45', border: 'none', borderRadius: 9999,
              cursor: agreed ? 'pointer' : 'not-allowed', opacity: agreed ? 1 : 0.4,
              transition: 'background 150ms ease, box-shadow 150ms ease',
            }}
          >
            Enter AlphaYields
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ay-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ay-modalbox-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .ay-legal-link { color: #A6ED45; text-decoration: none; }
        .ay-legal-link:hover { text-decoration: underline; }
      `}</style>
    </div>,
    document.body,
  )
}
