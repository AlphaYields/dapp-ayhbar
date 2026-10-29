'use client'

import { useRouter } from 'next/navigation'

export function StateNoPositions() {
  const router = useRouter()

  return (
    <div className="np-state">
      <div className="np-loader">
        <span className="np-loader-ring" />
        <span className="np-loader-spin" />
        <span className="np-loader-dot" />
      </div>

      <div className="np-title np-enter" style={{ animationDelay: '80ms' }}>
        You currently have no open positions
      </div>
      <div className="np-sub np-enter" style={{ animationDelay: '160ms' }}>
        Start earning yield by depositing into one of our strategies.
      </div>
      <button
        className="btn btn-green btn-lg np-enter"
        style={{ animationDelay: '240ms' }}
        onClick={() => router.push('/aytokens')}
      >
        Explore ayTOKENs
      </button>
    </div>
  )
}
