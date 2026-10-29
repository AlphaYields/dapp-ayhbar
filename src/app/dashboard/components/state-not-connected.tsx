'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'

export function StateNotConnected() {
  return (
    <div className="nc-state">
      <div className="nc-sonar">
        <span className="nc-sonar-ring" />
        <span className="nc-sonar-ring r2" />
        <span className="nc-sonar-dot" />
      </div>
      <h1 className="nc-headline">The Yield Layer of DeFi</h1>
      <p className="nc-sub">One token. Verified, auto-compounding yield.</p>
      <ConnectButton.Custom>
        {({ openConnectModal, mounted }) => (
          <div
            style={{
              marginTop: 34,
              ...(!mounted && { opacity: 0, pointerEvents: 'none', userSelect: 'none' }),
            }}
            {...(!mounted && { 'aria-hidden': true })}
          >
            <button onClick={openConnectModal} className="btn btn-green btn-lg">
              Connect wallet
            </button>
          </div>
        )}
      </ConnectButton.Custom>
    </div>
  )
}
