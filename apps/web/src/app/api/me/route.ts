import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/session';
import { getDashboardStats, getWalletSummary } from '@/lib/services';
import { getFeed } from '@/lib/services';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  const [stats, wallet, trending] = await Promise.all([
    getDashboardStats(user),
    getWalletSummary(user),
    getFeed({ sort: 'viral', limit: 6 }),
  ]);
  return NextResponse.json({ user, stats, wallet, trending: trending.items });
}
