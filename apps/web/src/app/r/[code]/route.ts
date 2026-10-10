import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

/** Public short link: /r/:code → record click → 302 to the marketplace. */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const store = await getStore();
  const link = await store.getLinkByCode(code);
  if (!link) return new NextResponse('Link não encontrado', { status: 404 });

  await store.recordClick({
    linkCode: link.code,
    marketplace: link.marketplace,
    userAgent: request.headers.get('user-agent') ?? undefined,
    ip: request.headers.get('x-forwarded-for') ?? undefined,
    country: request.headers.get('x-vercel-ip-country') ?? 'BR',
  });

  return NextResponse.redirect(link.destinationUrl, 302);
}
