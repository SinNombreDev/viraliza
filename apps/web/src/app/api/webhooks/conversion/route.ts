import { NextResponse } from 'next/server';
import { recordConversion } from '@/lib/services';

export const dynamic = 'force-dynamic';

/**
 * Conversion postback. In production each marketplace (or an aggregator like a
 * postback network) calls this with a signed payload when an order is approved.
 * Verify the signature header against the marketplace secret before trusting it.
 *
 * Body: { code, orderValueCents, externalOrderId?, commissionPercent?, marketplace? }
 * (You may accept `price` in reais instead of `orderValueCents`.)
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    code?: string;
    orderValueCents?: number;
    price?: number;
    externalOrderId?: string;
    commissionPercent?: number;
  };

  const code = body.code;
  const orderValueCents =
    body.orderValueCents ?? (typeof body.price === 'number' ? Math.round(body.price * 100) : undefined);

  if (!code || !orderValueCents) {
    return NextResponse.json({ error: 'code e orderValueCents (ou price) são obrigatórios' }, { status: 400 });
  }

  try {
    const result = await recordConversion({
      code,
      orderValueCents,
      externalOrderId: body.externalOrderId,
      commissionPercent: body.commissionPercent,
    });
    return NextResponse.json({
      ok: true,
      conversionId: result.conversion.id,
      net: result.split.netCommissionCents,
      platformFee: result.split.platformFeeCents,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao registrar conversão' },
      { status: 404 },
    );
  }
}
