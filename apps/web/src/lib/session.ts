import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import type { User } from '@viraliza/core';
import { appConfig } from './config';
import { getStore } from './store';

const COOKIE = 'viraliza_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function sign(userId: string): string {
  const sig = createHmac('sha256', appConfig.appSecret).update(userId).digest('base64url');
  return `${userId}.${sig}`;
}

/** Public token form (used by the mobile app as a Bearer token). */
export function createToken(userId: string): string {
  return sign(userId);
}

/** Verify a token and return the user id, or null. */
export function verifyToken(token: string | undefined): string | null {
  return verify(token);
}

function verify(token: string | undefined): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf('.');
  if (idx <= 0) return null;
  const userId = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = createHmac('sha256', appConfig.appSecret).update(userId).digest('base64url');
  try {
    if (sig.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return userId;
  } catch {
    return null;
  }
}

/** Read the signed session cookie and resolve the current user (or null). */
export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const userId = verify(jar.get(COOKIE)?.value);
  if (!userId) return null;
  return (await getStore()).getUser(userId);
}

/**
 * Resolve the current user from a Request: Bearer token (mobile) or session
 * cookie (web). Used by API routes that both clients call.
 */
export async function authenticate(request: Request): Promise<User | null> {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const userId = verify(auth.slice(7).trim());
    if (userId) return (await getStore()).getUser(userId);
  }
  return getCurrentUser();
}

/** Route-handler only: start a session for a user. */
export async function startSession(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, sign(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

/** Route-handler only: clear the session. */
export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
