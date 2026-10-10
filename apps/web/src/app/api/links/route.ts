import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/session';
import { PlanLimitError, ProductNotFoundError, createLinkForUser, listLinks } from '@/lib/services';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  return NextResponse.json({ items: await listLinks(user.id) });
}

export async function POST(request: Request) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { productId?: string };
  if (!body.productId) return NextResponse.json({ error: 'productId é obrigatório' }, { status: 400 });

  try {
    const link = await createLinkForUser(user.id, body.productId);
    return NextResponse.json({ link }, { status: 201 });
  } catch (err) {
    const status = err instanceof PlanLimitError ? 402 : err instanceof ProductNotFoundError ? 404 : 500;
    const message = err instanceof Error ? err.message : 'Erro ao criar link';
    return NextResponse.json({ error: message }, { status });
  }
}
