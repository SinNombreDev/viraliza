import { NextResponse } from 'next/server';
import type { ChatMessage, RankedProduct } from '@viraliza/core';
import { authenticate } from '@/lib/session';
import { getAgent, getProduct } from '@/lib/services';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await authenticate(request);
  const body = (await request.json().catch(() => ({}))) as {
    message?: string;
    history?: ChatMessage[];
  };
  const message = (body.message ?? '').trim();
  if (!message) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 });

  const agent = await getAgent(user?.id);
  const reply = await agent.reply(message, {
    history: body.history ?? [],
    plan: user?.plan,
    context: { userId: user?.id, plan: user?.plan, canGenerateLinks: Boolean(user) },
  });

  // Hydrate product cards for the UI.
  const products: RankedProduct[] = (
    await Promise.all((reply.message.productIds ?? []).map((id) => getProduct(id)))
  ).filter((p): p is RankedProduct => Boolean(p));

  return NextResponse.json({
    message: reply.message,
    createdLink: reply.createdLink ?? null,
    products,
  });
}
