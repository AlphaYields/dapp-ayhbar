import { NextResponse } from 'next/server';

export interface TransactionItem {
  tx_hash: string;
  from: string;
  to: string;
  value: string;
  method: string;
  status: string;
}

interface TransactionsAPIResponse {
  items: TransactionItem[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Missing address parameter' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://accounting.alphayields.ai/transactions?address=${address}`, {
      next: { revalidate: 60 },
      headers: {
        'x-api-key': process.env.ACCOUNTING_API_KEY as string,
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = (await response.json()) as TransactionsAPIResponse;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
