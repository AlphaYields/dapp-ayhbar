import { CHAIN_EXPLORER, HUB_CHAIN_ID } from '@/lib/constants'

export function ProgressDots({ active, count = 3 }: { active: number; count?: number }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '16px 0' }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: i <= active ? '#A6ED45' : 'rgba(255,255,255,0.1)',
          transition: 'all 0.4s', transform: i === active ? 'scale(1.3)' : 'scale(1)',
          boxShadow: i === active ? '0 0 12px rgba(166,237,69,0.5)' : 'none',
        }} />
      ))}
    </div>
  )
}

export function PulseRing({ color = '#A6ED45' }: { color?: string }) {
  return (
    <div style={{ position: 'relative', width: 64, height: 64 }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: `3px solid ${color}`, opacity: 0.3,
        animation: 'pulse-ring 1.5s ease-out infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 8, borderRadius: '50%',
        border: `2px solid ${color}`, opacity: 0.6,
        animation: 'pulse-ring 1.5s ease-out 0.3s infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 16, borderRadius: '50%',
        background: `${color}22`, border: `2px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: color,
          animation: 'pulse-glow 1s ease-in-out infinite' }} />
      </div>
    </div>
  )
}

export function ModalKeyframes({ hideNumberSpinners = false }: { hideNumberSpinners?: boolean }) {
  return (
    <style>{`
      @keyframes pulse-glow { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
      @keyframes pulse-ring { 0% { transform:scale(1); opacity:0.6; } 100% { transform:scale(1.8); opacity:0; } }
      @keyframes pop-in { 0% { transform:scale(0); } 100% { transform:scale(1); } }
      ${hideNumberSpinners ? `
      input[type="number"]::-webkit-inner-spin-button,
      input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; }
      input[type="number"] { -moz-appearance: textfield; }
      ` : ''}
    `}</style>
  )
}

export function TxViewLink({ txHash, chainId = HUB_CHAIN_ID }: { txHash: string; chainId?: number }) {
  return (
    <a
      href={`${CHAIN_EXPLORER[chainId]}/${txHash}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: '#A6ED45', textDecoration: 'none', fontSize: 14,
        display: 'inline-flex', alignItems: 'center', gap: 4,
      }}
    >
      View transaction
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M3 9L9 3M9 3H4M9 3V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  )
}
