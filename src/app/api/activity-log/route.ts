import { ActivityLogAPIResponse } from '@/types/data';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vaultAddress = searchParams.get('vaultAddress');
  const limit = searchParams.get('limit') ?? '20';
  const offset = searchParams.get('offset') ?? '0';

  try {
    const response = await fetch(
      `https://accounting.alphayields.ai/activity-log?vault_address=${vaultAddress}&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'x-api-key': process.env.ACCOUNTING_API_KEY as string,
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = (await response.json()) as ActivityLogAPIResponse;
    return NextResponse.json(data as ActivityLogAPIResponse);
  } catch (error) {
    console.error('Error fetching accounting activity-log:', error);
    return NextResponse.json({ error: 'Failed to fetch accounting activity-log' }, { status: 500 });
  }
}
