/**
 * Viraliza — core domain types.
 *
 * These types are the single source of truth shared by the web app, the mobile
 * app, the API, the AI agent, the WhatsApp service and every marketplace
 * adapter. Keep them free of framework/runtime dependencies.
 */

/** The marketplaces Viraliza aggregates at launch. */
export type MarketplaceId = 'mercadolivre' | 'shopee' | 'amazon';

export const MARKETPLACES: MarketplaceId[] = ['mercadolivre', 'shopee', 'amazon'];

/** A normalised product coming out of a marketplace adapter. */
export interface Product {
  /** Stable id inside Viraliza, e.g. "shopee:123456". */
  id: string;
  marketplace: MarketplaceId;
  /** The marketplace's own product id. */
  externalId: string;
  title: string;
  description: string;
  imageUrl: string;
  /** Extra images (gallery). */
  images?: string[];
  category: string;
  /** Current selling price in the smallest currency unit (centavos). */
  priceCents: number;
  /** "Was" price for discount display, in centavos. */
  originalPriceCents?: number;
  currency: CurrencyCode;
  rating: number;
  reviewsCount: number;
  /** Units sold in the trailing window reported by the marketplace. */
  salesCount: number;
  /** Canonical product URL on the marketplace. */
  url: string;
  /** Whether the marketplace reports the item as trending / hot. */
  trending?: boolean;
  /** Marketplace-reported commission rate (percent of order value), if any. */
  commissionPercent?: number;
  /** Free-text tags used by the agent and search. */
  tags?: string[];
  /** ISO timestamp of when Viraliza last synced this product. */
  syncedAt: string;
}

/** A product enriched with Viraliza-computed ranking signals. */
export interface RankedProduct extends Product {
  /** 0-100 "how likely to sell right now" score. */
  viralScore: number;
  /** Human-readable reasons behind the score (used by the AI agent). */
  viralReasons: string[];
  /** Discount percentage off original price, 0 when no discount. */
  discountPercent: number;
  /** Estimated commission for the affiliate in centavos (net to user). */
  estimatedNetCommissionCents: number;
}

export type CurrencyCode = 'BRL';

/** A user-generated, shareable affiliate link. */
export interface AffiliateLink {
  id: string;
  /** Short, URL-safe code used in the public /r/:code redirect. */
  code: string;
  userId: string;
  productId: string;
  marketplace: MarketplaceId;
  title: string;
  imageUrl: string;
  /** Where the visitor lands (marketplace URL + affiliate/tracking params). */
  destinationUrl: string;
  /** Ready-to-send WhatsApp deep link. */
  whatsappShareUrl: string;
  /** Marketplaces' own affiliate short link, when the API returns one. */
  providerShortUrl?: string;
  clicks: number;
  conversions: number;
  earningsCents: number;
  createdAt: string;
}

/** A confirmed (or pending) sale attributed to an affiliate link. */
export interface Conversion {
  id: string;
  linkId: string;
  userId: string;
  marketplace: MarketplaceId;
  /** Order total, centavos. */
  orderValueCents: number;
  /** Commission the marketplace pays Viraliza, centavos. */
  grossCommissionCents: number;
  /** Viraliza's cut, centavos. */
  platformFeeCents: number;
  /** What the affiliate receives, centavos. */
  netCommissionCents: number;
  /** Referral bonus paid to the inviter, centavos. */
  referralBonusCents: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  createdAt: string;
  settledAt?: string;
}

export type PlanId = 'free' | 'pro' | 'business';
export type PlanBilling = 'monthly' | 'one_time';

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  billing: PlanBilling;
  /** Price in centavos. */
  priceCents: number;
  /** Perks shown in the paywall / pricing UI. */
  features: string[];
  /** Max shareable links a user can have active at once. `null` = unlimited. */
  maxActiveLinks: number | null;
  /** Platform fee override for this plan (percent). Lower on paid plans. */
  platformFeePercent: number;
  /** Access to the AI agent chat. */
  aiAgent: boolean;
  /** Access to WhatsApp auto-broadcast. */
  whatsappAutomation: boolean;
  /** Priority in viral feed. */
  priorityFeed: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  /** E.164 phone, e.g. +5511999999999. */
  phone?: string;
  /** Public invite code; new users sign up with it to reward the inviter. */
  referralCode: string;
  /** Who invited this user, if anyone. */
  referredBy?: string;
  plan: PlanId;
  /** Spendable wallet balance, centavos. */
  balanceCents: number;
  /** Lifetime earnings, centavos. */
  lifetimeEarningsCents: number;
  createdAt: string;
}

export type WalletEntryType =
  | 'commission'
  | 'referral_bonus'
  | 'payout'
  | 'subscription'
  | 'adjustment';

export interface WalletEntry {
  id: string;
  userId: string;
  type: WalletEntryType;
  /** Signed amount in centavos (positive = credit, negative = debit). */
  amountCents: number;
  description: string;
  /** Link to a conversion/order when relevant. */
  refId?: string;
  createdAt: string;
}

/** Result of a viral-feed / search query. */
export interface FeedQuery {
  marketplace?: MarketplaceId | 'all';
  category?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  /** Free-text search. */
  query?: string;
  /** Sort strategy for the feed. */
  sort?: 'viral' | 'sales' | 'commission' | 'discount' | 'price_asc' | 'price_desc';
  limit?: number;
  cursor?: string;
}

export interface Paged<T> {
  items: T[];
  nextCursor: string | null;
  total: number;
}

/** A single chat turn with the AI sales agent. */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  /** Present on assistant messages: products referenced by the reply. */
  productIds?: string[];
  /** Present on assistant messages: suggested shareable text. */
  shareText?: string;
  at?: string;
}

export interface AgentContext {
  userId?: string;
  plan?: PlanId;
  /** Products the agent may reference (usually the current feed/query result). */
  products?: Product[];
  /** Whether the user is allowed to generate links. */
  canGenerateLinks?: boolean;
}
