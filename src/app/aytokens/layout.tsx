import { ReactNode } from 'react';

// Client token pages use react-query (useVaults) for live data.
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function TokenLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
