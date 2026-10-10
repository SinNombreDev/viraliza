import { NextResponse } from 'next/server';
import {
  commissionMessage,
  dailyTopMessage,
  helpMessage,
  parseInbound,
  verifyWebhook,
  welcomeMessage,
  type WebhookPayload,
} from '@viraliza/whatsapp';
import { appConfig } from '@/lib/config';
import { getStore } from '@/lib/store';
import { getAgent, getFeed, getWhatsApp } from '@/lib/services';

export const dynamic = 'force-dynamic';

/** Meta verification handshake. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const challenge = verifyWebhook(
    {
      'hub.mode': searchParams.get('hub.mode') ?? undefined,
      'hub.verify_token': searchParams.get('hub.verify_token') ?? undefined,
      'hub.challenge': searchParams.get('hub.challenge') ?? undefined,
    },
    appConfig.whatsapp.verifyToken,
  );
  if (challenge === null) return new NextResponse('Forbidden', { status: 403 });
  return new NextResponse(challenge, { status: 200 });
}

/**
 * Inbound messages. The bot answers: TOP (viral list), AJUDA, COMISSÃO, or
 * anything else via the AI sales agent — which can mint an affiliate link.
 */
export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as WebhookPayload;
  const messages = parseInbound(payload);
  const store = await getStore();
  const wa = getWhatsApp();

  for (const msg of messages) {
    const phone = `+${msg.from}`;
    await store.upsertLead({ phone, name: msg.name, optedIn: true, source: 'whatsapp' });
    const user = await store.getUserByPhone(phone);
    const text = msg.text.trim();
    const upper = text.toUpperCase();

    try {
      if (!text) {
        await wa.sendText({ to: phone, body: helpMessage() });
        continue;
      }
      if (upper === 'TOP' || upper === 'MAIS VIRAIS' || upper === 'VIRAL') {
        const feed = await getFeed({ sort: 'viral', limit: 5 });
        await wa.sendText({ to: phone, body: dailyTopMessage(feed.items) });
        continue;
      }
      if (upper === 'AJUDA' || upper === 'HELP') {
        await wa.sendText({ to: phone, body: helpMessage() });
        continue;
      }
      if (upper === 'COMISSÃO' || upper === 'COMISSAO') {
        if (user) {
          await wa.sendText({
            to: phone,
            body: commissionMessage({
              balanceCents: user.balanceCents,
              lifetimeCents: user.lifetimeEarningsCents,
              pendingCents: 0,
            }),
          });
        } else {
          await wa.sendText({ to: phone, body: welcomeMessage(msg.name) });
        }
        continue;
      }

      const agent = await getAgent(user?.id);
      const reply = await agent.reply(text, { plan: user?.plan, context: { userId: user?.id } });
      await wa.sendText({ to: phone, body: reply.message.content });
      if (reply.createdLink) {
        await wa.sendText({ to: phone, body: `🔗 ${reply.createdLink.shortUrl}` });
      }
    } catch {
      await wa.sendText({ to: phone, body: 'Ops, tive um problema aqui. Tente de novo em instantes. 🙏' });
    }
  }

  return NextResponse.json({ received: messages.length });
}
