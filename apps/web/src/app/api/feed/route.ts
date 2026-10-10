import { NextResponse } from 'next/server';
import type { FeedQuery, MarketplaceId } from '@viraliza/core';
import { getFeed } from '@/lib/services';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query: FeedQuery = {
    marketplace: (searchParams.get('marketplace') as MarketplaceId | 'all') ?? 'all',
    category: searchParams.get('category') ?? undefined,
    query: searchParams.get('q') ?? undefined,
    sort: (searchParams.get('sort') as FeedQuery['sort']) ?? 'viral',
    limit: Number(searchParams.get('limit') ?? 24),
    cursor: searchParams.get('cursor') ?? undefined,
    minPriceCents: searchParams.get('min') ? Number(searchParams.get('min')) * 100 : undefined,
    maxPriceCents: searchParams.get('max') ? Number(searchParams.get('max')) * 100 : undefined,
  };

  const page = await getFeed(query);
  return NextResponse.json(page);
}
