import { NextResponse } from 'next/server';
import { generateReferralCode } from '@viraliza/core';
import { getStore } from '@/lib/store';
import { createToken, startSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * Passwordless dev login/signup. In production this endpoint is replaced by
 * phone-OTP (WhatsApp) or OAuth; the session mechanism stays the same.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
    phone?: string;
    referralCode?: string;
  };
  const email = (body.email ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 });
  }

  const store = await getStore();
  let user = await store.getUserByEmail(email);

  if (!user) {
    let referredBy: string | undefined;
    if (body.referralCode) {
      const inviter = await store.getUserByReferralCode(body.referralCode.trim().toUpperCase());
      if (inviter) referredBy = inviter.id;
    }
    user = await store.createUser({
      name: body.name?.trim() || email.split('@')[0]!,
      email,
      phone: body.phone,
      referredBy,
      referralCode: generateReferralCode(body.name ?? email.split('@')[0]),
    });
  }

  await startSession(user.id);
  // Also return a bearer token so native/mobile clients (no cookie jar) can call the API.
  return NextResponse.json({ user, token: createToken(user.id) });
}
