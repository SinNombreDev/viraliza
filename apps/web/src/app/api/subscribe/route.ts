import { NextResponse } from 'next/server';
import { PLANS, ONE_TIME_PLAN, type PlanId } from '@viraliza/core';
import { getStore } from '@/lib/store';
import { getCurrentUser } from '@/lib/session';
import { appConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Subscribe / upgrade. In production this creates a Stripe Checkout Session (or
 * a PIX charge) and the webhook flips the user's plan; here it applies instantly
 * so the flow is testable end-to-end.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    plan?: PlanId;
    billing?: 'monthly' | 'one_time';
  };
  const billing = body.billing ?? 'monthly';
  const plan = body.plan ?? 'pro';

  if (plan === 'free') {
    const store = await getStore();
    const updated = await store.updateUser(user.id, { plan: 'free' });
    await store.upsertSubscription({
      userId: user.id,
      plan: 'free',
      billing: 'monthly',
      status: 'canceled',
      provider: 'mock',
    });
    return NextResponse.json({ user: updated });
  }

  const priceCents = billing === 'one_time' ? ONE_TIME_PLAN.priceCents : PLANS[plan].priceCents;
  const store = await getStore();

  const updated = await store.updateUser(user.id, { plan });
  await store.upsertSubscription({
    userId: user.id,
    plan,
    billing,
    status: 'active',
    provider: appConfig.stripe.secretKey ? 'stripe' : 'mock',
    currentPeriodEnd:
      billing === 'monthly' ? new Date(Date.now() + 30 * 86_400_000).toISOString() : undefined,
  });
  await store.addWalletEntry({
    userId: user.id,
    type: 'subscription',
    amountCents: -priceCents,
    description: `Assinatura ${billing === 'one_time' ? 'vitalícia' : 'mensal'} — plano ${PLANS[plan].name}`,
  });

  return NextResponse.json({ user: updated, priceCents });
}
