import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const vaultAddress = searchParams.get('vaultAddress');
    if (!address) {
      return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
    }

    const response = await fetch(
      `https://accounting.alphayields.ai/userdata?address=${address}&vault_address=${vaultAddress}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ACCOUNTING_API_KEY as string,
        },
        // Disable caching to always get fresh data
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: response.status });
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('Error parsing user data:', error);
      return NextResponse.json({ error: 'Failed to parse user data' }, { status: 502 });
    }

    return NextResponse.json(data, {
      headers: {
        // Allow caching for 30 seconds
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
