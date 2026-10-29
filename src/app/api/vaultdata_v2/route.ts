import { VaultData, VaultDataAPIResponse } from '@/types/data';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vaultAddress = searchParams.get('vaultAddress');

  const apiKey = process.env.ACCOUNTING_API_KEY;

  if (!apiKey) {
    console.error('[vault-data] ACCOUNTING_API_KEY is not set in this environment');
    return NextResponse.json({ error: 'Server misconfigured: missing ACCOUNTING_API_KEY' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://accounting.alphayields.ai/vaultdata?vaultAddress=${vaultAddress}`, {
      cache: 'no-store',
      headers: { 'x-api-key': apiKey },
    });

    if (!response.ok) {
      console.error(`Upstream vaultdata error: ${response.status} for vault ${vaultAddress}`);
      return NextResponse.json(
        { error: 'Failed to fetch vault data', upstreamStatus: response.status, navUsd: null },
        { status: 502 }
      );
    }

    const rawData = (await response.json()) as VaultDataAPIResponse;

    const info = rawData.general_info;

    const apy = parseFloat(info?.apy || '0') * 100;
    const apy_7d = parseFloat(info?.apy_7d || '0') * 100;
    // Vault younger than the window has no 30d/90d figure yet — fall back to all-time APY.
    const ageDays = info?.time_since_inception ?? 0;
    const apy_1m = ageDays < 30 ? apy : parseFloat(info?.apy_1m || '0') * 100;
    const apy_3m = ageDays < 90 ? apy : parseFloat(info?.apy_3m || '0') * 100;
    // Net APY in raw KAT terms — null upstream for every vault but ayKAT.
    const kat = (v?: string | null) => (v != null ? parseFloat(v) * 100 : null);
    const apy_kat = kat(info?.apy_kat);
    const apy_kat_7d = kat(info?.apy_kat_7d);
    const apy_kat_1m = ageDays < 30 ? apy_kat : kat(info?.apy_kat_1m);
    const apy_kat_3m = ageDays < 90 ? apy_kat : kat(info?.apy_kat_3m);
    // Katana compounds the parts, so staking is the pure component, not net - strategies.
    const staking = (net: number | null, strategies: number) =>
      net != null ? ((100 + net) / (100 + strategies) - 1) * 100 : null;

    return NextResponse.json({
      time_since_inception: info?.time_since_inception || 0,
      last_share_price: info?.last_share_price || 0,
      pnl_since_inception: parseFloat(info?.pnl_since_inception || '0') * 100,
      // Upstream apy_kat_x is already the full net APY in KAT,
      // (1 + staking)(1 + apy) - 1, so apy* = apy_kat_x and apy_kat* = the
      // staking part alone, (1 + apy_kat_x) / (1 + apy_x) - 1.
      apy: apy_kat ?? apy,
      apy_1m: apy_kat_1m ?? apy_1m,
      apy_3m: apy_kat_3m ?? apy_3m,
      apy_7d: apy_kat_7d ?? apy_7d,
      apy_kat: staking(apy_kat, apy),
      apy_kat_7d: staking(apy_kat_7d, apy_7d),
      apy_kat_1m: staking(apy_kat_1m, apy_1m),
      apy_kat_3m: staking(apy_kat_3m, apy_3m),
      under_maintenance: info?.under_maintenance,
      max_drawdown: parseFloat(info?.max_drawdown || '0') * 100,
      nav_usd: parseFloat(info?.nav_usd || '0'),
      total_pnl_usd: parseFloat(info?.total_pnl_usd || '0'),
      data: rawData.historical_data || [],
      sharpe_ratio: info?.sharpe_ratio ? parseFloat(info?.sharpe_ratio) : undefined,
      sub_vaults: rawData.sub_vaults ?? null,
      nav_denomination_token: parseFloat(info?.nav_denomination_token || '0'),
      total_pnl_denomination_token: parseFloat(info?.total_pnl_denomination_token || '0'),
    } as VaultData);
  } catch (error) {
    console.error('Error fetching vault data:', error);
    return NextResponse.json({ error: 'Failed to fetch vault data', navUsd: null }, { status: 500 });
  }
}
