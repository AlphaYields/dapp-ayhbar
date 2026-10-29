import { AccountingAPIResponse } from '@/types/data';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vaultAddress = searchParams.get('vaultAddress');
  const walletAddress = searchParams.get('walletAddress');

  try {
    const response = await fetch(
      `https://accounting.alphayields.ai/pnl?vault_address=${vaultAddress}&wallet_address=${walletAddress}`,
      {
        headers: {
          'x-api-key': process.env.ACCOUNTING_API_KEY as string,
        },
        next: { revalidate: 60 },
      }
    );

    // A wallet with no positions yet returns 404 ({ detail: "No PnL data for this wallet" }).
    // That is an empty state, not an error — return an empty object so the client resolves it
    // as "no PnL data" (consumers optional-chain pnl fields) and the dashboard falls through to
    // the "No positions" state (gated by user data) instead of surfacing a 5xx.
    if (response.status === 404) {
      return NextResponse.json({});
    }

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = (await response.json()) as AccountingAPIResponse;
    return NextResponse.json(data as AccountingAPIResponse);
  } catch (error) {
    console.error('Error fetching accounting pnl:', error);
    return NextResponse.json({ error: 'Failed to fetch accounting pnl' }, { status: 500 });
  }
}
