/**
 * Tiny API client for the Viraliza backend (the Next.js app).
 *
 * Configure the base URL with EXPO_PUBLIC_API_URL. On a physical device,
 * `localhost` points at the phone — use your computer's LAN IP instead:
 *   EXPO_PUBLIC_API_URL=http://192.168.0.10:3000 npx expo start
 */
import type { AffiliateLink, ChatMessage, RankedProduct } from '@viraliza/core';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

let authToken: string | null = null;
export function setToken(token: string | null) {
  authToken = token;
}
export function getToken() {
  return authToken;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (authToken) headers.authorization = `Bearer ${authToken}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.error ?? `Erro ${res.status}`);
  return data as T;
}

export interface FeedPage {
  items: RankedProduct[];
  nextCursor: string | null;
  total: number;
}

export const api = {
  base: BASE,
  feed: (params: { sort?: string; marketplace?: string; category?: string; q?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== 'all') qs.set(k === 'q' ? 'q' : k, String(v));
    });
    return request<FeedPage>(`/api/feed?${qs.toString()}`);
  },
  login: (email: string, name?: string) =>
    request<{ user: { id: string; name: string; email: string; plan: string; referralCode: string; balanceCents: number; lifetimeEarningsCents: number }; token: string }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ email, name }) },
    ),
  me: () =>
    request<{
      user: any;
      stats: { linksCount: number; clicks: number; sales: number; earnedCents: number; balanceCents: number; conversionRate: number };
      wallet: { balanceCents: number; lifetimeCents: number; pendingCents: number; entries: any[]; conversions: any[] };
      trending: RankedProduct[];
    }>('/api/me'),
  links: () => request<{ items: AffiliateLink[] }>('/api/links'),
  createLink: (productId: string) =>
    request<{ link: AffiliateLink }>('/api/links', { method: 'POST', body: JSON.stringify({ productId }) }),
  chat: (message: string, history: ChatMessage[]) =>
    request<{ message: ChatMessage; products: RankedProduct[]; createdLink: AffiliateLink | null }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
};
