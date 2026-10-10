/**
 * DataStore — the persistence contract.
 *
 * Two implementations:
 *   • MemoryStore (memory.ts) — zero-setup, seeded, used in dev/demo.
 *   • PrismaStore (prisma-store.ts) — Postgres via Prisma, used in production.
 *
 * Everything above this layer (API routes, agent, services) depends only on
 * this interface, so switching stores is a one-line change.
 */

import type {
  AffiliateLink,
  Conversion,
  MarketplaceId,
  PlanId,
  User,
  WalletEntry,
  WalletEntryType,
} from '@viraliza/core';

export interface Lead {
  id: string;
  phone: string;
  name?: string;
  userId?: string;
  optedIn: boolean;
  source?: string;
  lastSeen: string;
}

export interface ClickEvent {
  id: string;
  linkCode: string;
  marketplace: MarketplaceId;
  userAgent?: string;
  ip?: string;
  country?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanId;
  billing: 'monthly' | 'one_time';
  status: 'active' | 'canceled' | 'past_due';
  provider: string;
  providerRef?: string;
  currentPeriodEnd?: string;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  phone?: string;
  referredBy?: string;
  plan?: PlanId;
  affiliateTags?: Partial<Record<MarketplaceId, string>>;
}

export interface CreateLinkInput {
  code: string;
  userId: string;
  productId: string;
  marketplace: MarketplaceId;
  title: string;
  imageUrl: string;
  priceCents: number;
  destinationUrl: string;
  whatsappShareUrl: string;
  providerShortUrl?: string;
}

export interface CreateConversionInput {
  linkId: string;
  userId: string;
  marketplace: MarketplaceId;
  externalOrderId?: string;
  orderValueCents: number;
  grossCommissionCents: number;
  platformFeeCents: number;
  netCommissionCents: number;
  referralBonusCents: number;
  status?: Conversion['status'];
}

export interface DataStore {
  // ── Users ────────────────────────────────────────────────────────────────
  createUser(input: CreateUserInput & { referralCode: string; id?: string }): Promise<User>;
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByPhone(phone: string): Promise<User | null>;
  getUserByReferralCode(code: string): Promise<User | null>;
  updateUser(id: string, patch: Partial<User>): Promise<User | null>;
  listUsers(): Promise<User[]>;

  // ── Links ────────────────────────────────────────────────────────────────
  createLink(input: CreateLinkInput & { id?: string }): Promise<AffiliateLink>;
  getLinkByCode(code: string): Promise<AffiliateLink | null>;
  listLinksByUser(userId: string): Promise<AffiliateLink[]>;
  countActiveLinks(userId: string): Promise<number>;
  incrementLinkClicks(code: string): Promise<void>;
  applyConversionToLink(linkId: string, netCommissionCents: number): Promise<void>;

  // ── Conversions ──────────────────────────────────────────────────────────
  createConversion(input: CreateConversionInput & { id?: string }): Promise<Conversion>;
  listConversionsByUser(userId: string): Promise<Conversion[]>;
  listConversions(): Promise<Conversion[]>;

  // ── Wallet ───────────────────────────────────────────────────────────────
  addWalletEntry(entry: {
    id?: string;
    userId: string;
    type: WalletEntryType;
    amountCents: number;
    description: string;
    refId?: string;
  }): Promise<WalletEntry>;
  listWalletByUser(userId: string): Promise<WalletEntry[]>;

  // ── Leads & clicks ───────────────────────────────────────────────────────
  upsertLead(input: { phone: string; name?: string; userId?: string; optedIn?: boolean; source?: string }): Promise<Lead>;
  getLeadByPhone(phone: string): Promise<Lead | null>;
  listLeads(): Promise<Lead[]>;
  recordClick(input: Omit<ClickEvent, 'id' | 'createdAt'>): Promise<ClickEvent>;

  // ── Subscriptions ────────────────────────────────────────────────────────
  upsertSubscription(input: Omit<Subscription, 'id' | 'createdAt'> & { id?: string }): Promise<Subscription>;
  getSubscription(userId: string): Promise<Subscription | null>;
}
