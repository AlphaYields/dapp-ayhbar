import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://api.alphayields.ai/api/vaultdata', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Disable caching to always get fresh data
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch vault data' },
        { status: response.status }
      )
    }

    const rawData = await response.json()

    // Transform the API response to match the expected format
    const transformedData = {
      time_since_inception: rawData.general_info?.time_since_inception || 0,
      last_share_price: rawData.general_info?.last_share_price || 0,
      pnl_since_inception: parseFloat(rawData.general_info?.pnl_since_inception || '0') * 100,
      apy: parseFloat(rawData.general_info?.apy || '0') * 100,
      max_drawdown: parseFloat(rawData.general_info?.max_drawdown || '0') * 100,
      nav_flow: parseFloat(rawData.general_info?.nav_flow || '0'),
      nav_usd: parseFloat(rawData.general_info?.nav_usd || '0'),
      total_pnl_flow: parseFloat(rawData.general_info?.total_pnl_flow || '0'),
      total_pnl_usd: parseFloat(rawData.general_info?.total_pnl_usd || '0'),
      data: rawData.historical_data || []
    }

    return NextResponse.json(transformedData, {
      headers: {
        // Allow caching for 30 seconds
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching vault data:', error)
    return NextResponse.json(
      { error: 'Internal server error 2' },
      { status: 500 }
    )
  }
}
