'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, type State } from 'wagmi'
import { connect, getAccount, reconnect } from '@wagmi/core'
import { RainbowKitProvider, darkTheme, type Theme } from '@rainbow-me/rainbowkit'
import { config } from '@/lib/wagmi'
import { ReactNode, createContext, useContext, useEffect, useState } from 'react'

const WalletReadyContext = createContext<boolean>(true)
export const useWalletReady = () => useContext(WalletReadyContext)

const alphaYieldsTheme: Theme = {
  ...darkTheme(),
  colors: {
    ...darkTheme().colors,
    accentColor: '#A6ED45',
    accentColorForeground: '#25262A',
    connectButtonBackground: '#4A4B50',
    connectButtonInnerBackground: '#3D3E42',
    connectButtonText: '#FFFFFF',
    modalBackground: '#25262A',
    modalBorder: 'rgba(255, 255, 255, 0.08)',
    modalText: '#FFFFFF',
    modalTextDim: 'rgba(255, 255, 255, 0.4)',
    modalTextSecondary: 'rgba(255, 255, 255, 0.6)',
    closeButton: 'rgba(255, 255, 255, 0.6)',
    closeButtonBackground: 'rgba(255, 255, 255, 0.08)',
    actionButtonBorder: 'rgba(255, 255, 255, 0.06)',
    actionButtonSecondaryBackground: '#38393C',
    generalBorder: 'rgba(255, 255, 255, 0.06)',
    generalBorderDim: 'rgba(255, 255, 255, 0.03)',
    menuItemBackground: '#38393C',
    profileAction: '#38393C',
    profileActionHover: '#4A4B50',
    profileForeground: '#2E2F33',
    selectedOptionBorder: '#A6ED45',
    connectionIndicator: '#A6ED45',
    downloadBottomCardBackground: 'linear-gradient(126deg, rgba(0, 0, 0, 0) 9.49%, rgba(166, 237, 69, 0.1) 71.04%), #25262A',
    downloadTopCardBackground: 'linear-gradient(126deg, rgba(166, 237, 69, 0.1) 9.49%, rgba(0, 0, 0, 0) 71.04%), #25262A',
    modalBackdrop: 'rgba(0, 0, 0, 0.6)',
  },
  radii: {
    ...darkTheme().radii,
    connectButton: '9999px',
    modal: '18px',
    modalMobile: '18px',
    actionButton: '9999px',
    menuButton: '12px',
  },
  shadows: {
    ...darkTheme().shadows,
    connectButton: 'none',
    dialog: '0px 8px 32px rgba(0, 0, 0, 0.4)',
    selectedWallet: '0px 2px 6px rgba(0, 0, 0, 0.3)',
  },
  fonts: {
    body: 'var(--font-inter), system-ui, sans-serif',
  },
}

function DeferredReconnect({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    let cancelled = false
    let done = false
    const finish = () => {
      if (cancelled || done) return
      done = true
      onDone()
    }

    const onAnnounce = () => { /* passive listener keeps mipd awake */ }
    window.addEventListener('eip6963:announceProvider', onAnnounce)
    window.dispatchEvent(new Event('eip6963:requestProvider'))

    // Some extensions (HashPack) announce their EIP-6963 provider after the first
    // attempt, so wagmi has no connector for the stored id yet. Wait for it (up to
    // ~3s), then reconnect again.
    const waitForConnector = async (id: string) => {
      for (let i = 0; i < 12 && !cancelled; i++) {
        const c = config.connectors.find((x) => x.id === id)
        if (c) return c
        await new Promise((r) => setTimeout(r, 250))
      }
      return undefined
    }

    const tryReconnect = async () => {
      if (cancelled || done) return
      try {
        await reconnect(config)
        const recentId = await config.storage?.getItem('recentConnectorId')
        if (getAccount(config).status !== 'connected' && typeof recentId === 'string') {
          const connector = await waitForConnector(recentId)
          if (connector && !cancelled) await reconnect(config, { connectors: [connector] })
          // HashPack forgets the site's permission on reload (eth_accounts → []), so
          // a silent reconnect can't work: ask again, which is what clicking
          // "Connect wallet" would do.
          if (connector && !cancelled && getAccount(config).status !== 'connected' && /hashpack/i.test(connector.name)) {
            await connect(config, { connector }).catch(() => {})
          }
        }
      } catch { /* fall through to finish */ }
      finish()
    }
    const t1 = window.setTimeout(tryReconnect, 150)
    const tFallback = window.setTimeout(finish, 4000)

    return () => {
      cancelled = true
      window.removeEventListener('eip6963:announceProvider', onAnnounce)
      window.clearTimeout(t1)
      window.clearTimeout(tFallback)
    }
  }, [onDone])
  return null
}

export function Providers({ children, initialState }: { children: ReactNode; initialState?: State }) {
  const [queryClient] = useState(() => new QueryClient())
  const hasStoredConnection = Boolean(initialState?.current)
  const [ready, setReady] = useState(!hasStoredConnection)

  return (
    <WagmiProvider config={config} initialState={initialState} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <WalletReadyContext.Provider value={ready}>
          <RainbowKitProvider theme={alphaYieldsTheme} locale={'en'} coolMode={false}>
            {hasStoredConnection && <DeferredReconnect onDone={() => setReady(true)} />}
            {children}
          </RainbowKitProvider>
        </WalletReadyContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
