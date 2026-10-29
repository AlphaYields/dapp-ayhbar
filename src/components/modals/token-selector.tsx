'use client'

import { useState, useEffect, useRef } from 'react'

export interface InputTokenOption {
  /** Output token id this input maps to (PYUSD → ayUSD, WFLOW → ayFLOW). */
  id: string
  label: string
  color: string
  /** Supported source chains for this input. Only Flow EVM ships today, but the
   *  column is data-driven so Ethereum / Base / others are a data change, not a
   *  structural one. The first entry is treated as the active network. */
  networks: string[]
}

// Deposit input picker — Deposit.dc two-column menu (input token | network).
// Each input token maps 1:1 to an output vault; picking one switches the output
// (and therefore the active vault). The network column renders the selected
// input's `networks` list and is built to extend beyond the single chain today.
export function TokenChainSelector({
  options,
  selectedId,
  onSelect,
}: {
  options: InputTokenOption[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const selected = options.find((o) => o.id === selectedId) ?? options[0]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} className="w-token-sel" style={{ border: 'none' }}>
        <span className="w-sel-dot" style={{ background: selected?.color }} />
        <span>{selected?.label}</span>
        <span className="w-caret">▾</span>
      </button>

      {open && (
        <div className="dtcs-menu">
          <div className="dtcs-col-l">
            {options.map((opt) => {
              const active = opt.id === selectedId
              return (
                <div
                  key={opt.id}
                  onClick={() => {
                    onSelect(opt.id)
                    setOpen(false)
                  }}
                  className={`dtcs-row ${active ? 'active' : ''}`}
                >
                  <span className="dtcs-dot" style={{ background: opt.color }} />
                  <span className="dtcs-label">{opt.label}</span>
                </div>
              )
            })}
          </div>
          <div className="dtcs-col-r">
            <div className="dtcs-net-head">Network</div>
            {(selected?.networks ?? []).map((net, i) => (
              <div key={net} className={`dtcs-row ${i === 0 ? 'active' : ''}`}>
                <span className="dtcs-net-label">{net}</span>
                {i === 0 && <span className="dtcs-check">✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
