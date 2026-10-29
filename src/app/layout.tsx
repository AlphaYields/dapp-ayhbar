import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { cookieToInitialState } from 'wagmi';
import { Providers } from '@/components/providers';
import { config } from '@/lib/wagmi';
import { inter, darkerGrotesque, poppins, jetbrainsMono } from '@/lib/fonts';
import { Navbar } from '@/components/navbar';

import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';
import './redesign.css';
import './withdraw.css';

export const metadata: Metadata = {
  title: 'ayHBAR · AlphaYields',
  description: 'Leveraged HBAR staking on Hedera',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = cookieToInitialState(config, (await headers()).get('cookie'));
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${darkerGrotesque.variable} ${poppins.variable} ${jetbrainsMono.variable} ${inter.className} flex min-h-screen flex-col`}
      >
        <Providers initialState={initialState}>
          <Navbar />
          <main className="flex min-h-[calc(100dvh-68px)] flex-1 flex-col">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
