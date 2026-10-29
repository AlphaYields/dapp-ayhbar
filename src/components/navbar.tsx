'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { cn } from '@/lib/utils';
import { useAccountChange } from '@/hooks/useAccountChange';
import { AppRoutes, ExternalLinks } from '@/types/links';
import { useWalletReady } from '@/components/providers';

export function Navbar() {
  useAccountChange();
  const walletReady = useWalletReady();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const hideChrome = pathname === '/maintenance';
  const aytokensActive = pathname.startsWith(AppRoutes.AYTOKENS);
  const dashboardActive = pathname.startsWith(AppRoutes.DASHBOARD);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (drawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [drawerOpen]);

  if (hideChrome) return null;

  return (
    <nav className={cn('navbar', scrolled && 'scrolled')}>
      <div className="nav-inner">
        <div className="nav-left">
          <Link href={AppRoutes.DASHBOARD} className="nav-logo">
            <Image
              src="/img_line_456_2.png"
              alt="AlphaYields"
              width={27}
              height={27}
              className="h-[27px] w-auto object-contain"
            />
            <span>AlphaYields</span>
          </Link>
          <span className="nav-divider" aria-hidden="true" />
          <a className="nav-back" href={ExternalLinks.WEBSITE}>
            <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 0 }}>
              ←
            </span>
            Back to website
          </a>
        </div>

        <div className="nav-right">
          <ul className="nav-links nav-desktop">
            <li>
              <Link href={AppRoutes.AYHBAR} className={cn('nav-section', aytokensActive && 'active')}>
                ayHBAR
              </Link>
            </li>
            <li>
              <Link href={AppRoutes.DASHBOARD} className={cn('nav-section', dashboardActive && 'active')}>
                Dashboard
              </Link>
            </li>
          </ul>

          {walletReady ? (
            <ConnectButton.Custom>
              {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button type="button" onClick={openConnectModal} className="nav-wallet">
                            <span className="nav-wallet-dot" style={{ background: 'rgba(244,245,242,0.35)' }} />
                            Connect Wallet
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button type="button" onClick={openChainModal} className="nav-wallet is-wrong">
                            <span className="nav-wallet-dot" style={{ background: '#ef4444' }} />
                            Wrong network
                          </button>
                        );
                      }

                      return (
                        <button type="button" onClick={openAccountModal} className="nav-wallet">
                          <span
                            className="nav-wallet-dot"
                            style={{ background: '#A6ED45', boxShadow: '0 0 6px #A6ED45' }}
                          />
                          {account.displayName}
                        </button>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          ) : (
            <div className="h-[36px] w-[140px] animate-pulse rounded-[9px] bg-white/5" />
          )}

          <button
            type="button"
            className="nav-burger"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div
        className={cn('nav-drawer-backdrop', drawerOpen && 'open')}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={cn('nav-drawer', drawerOpen && 'open')}
        aria-hidden={!drawerOpen}
        role="dialog"
        aria-label="Mobile navigation"
      >
        <div className="nav-drawer-head">
          <span className="nav-drawer-title">Menu</span>
          <button
            type="button"
            className="nav-drawer-close"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          >
            ×
          </button>
        </div>
        <ul className="nav-drawer-list">
          <li>
            <Link
              href={AppRoutes.AYHBAR}
              className={aytokensActive ? 'active' : ''}
              onClick={() => setDrawerOpen(false)}
            >
              ayHBAR
            </Link>
          </li>
          <li>
            <Link
              href={AppRoutes.DASHBOARD}
              className={dashboardActive ? 'active' : ''}
              onClick={() => setDrawerOpen(false)}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <a href={ExternalLinks.WEBSITE}>← Back to website</a>
          </li>
        </ul>
      </aside>
    </nav>
  );
}
