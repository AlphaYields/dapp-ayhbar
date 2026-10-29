import { NextResponse } from 'next/server';
import { TOKEN_PRICE_ID } from '@/lib/tokens';

/**
 * GET /api/prices → { [tokenSymbol]: usd } for every symbol in TOKEN_PRICE_ID.
 * One DefiLlama call (free, keyless — CoinGecko's keyless API now 403/429s), cached 60s server-side.
 */
export async function GET() {
  const ids = Array.from(new Set(Object.values(TOKEN_PRICE_ID))).join(',');
  try {
    const res = await fetch(`https://coins.llama.fi/prices/current/${ids}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`defillama ${res.status}`);
    const { coins } = (await res.json()) as { coins: Record<string, { price?: number }> };
    const prices: Record<string, number> = {};
    for (const [symbol, id] of Object.entries(TOKEN_PRICE_ID)) {
      const usd = coins[id]?.price;
      if (typeof usd === 'number') prices[symbol] = usd;
    }
    return NextResponse.json(prices, { headers: { 'Cache-Control': 'public, max-age=60' } });
  } catch (err) {
    console.error('[api/prices]', err);
    return NextResponse.json({}, { status: 502 });
  }
}
