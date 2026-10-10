/**
 * Marketplace adapter contract.
 *
 * Every marketplace (Mercado Livre, Shopee, Amazon, and anything added later)
 * implements this interface. Two implementations exist for each:
 *   • a live adapter that talks to the real affiliate/PA-API, and
 *   • the shared mock adapter fed by the demo catalog.
 *
 * `MarketplaceService` (aggregator.ts) picks the right one per config, so the
 * rest of the app never knows or cares whether data is real.
 */

import type { FeedQuery, MarketplaceId, Paged, Product } from '@viraliza/core';

export interface SearchOptions {
  limit?: number;
  offset?: number;
  category?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
}

export interface TrendingOptions {
  limit?: number;
  category?: string;
}

export interface AffiliateLinkResult {
  /** A marketplace-minted short/affiliate URL, when the API returns one. */
  shortUrl?: string;
  /** The full destination URL with affiliate params applied by the provider. */
  destinationUrl?: string;
}

export interface AffiliateIdentityLike {
  affiliateTag: string;
  userId: string;
  linkCode: string;
  campaign?: string;
}

export interface MarketplaceAdapter {
  readonly id: MarketplaceId;
  /** True when the adapter has real credentials and is not using mock data. */
  readonly live: boolean;
  search(query: string, options?: SearchOptions): Promise<Paged<Product>>;
  getProduct(externalId: string): Promise<Product | null>;
  trending(options?: TrendingOptions): Promise<Product[]>;
  /** Ask the marketplace to mint a tracked affiliate link for a product. */
  mintAffiliateLink?(
    product: Product,
    identity: AffiliateIdentityLike,
  ): Promise<AffiliateLinkResult>;
  /** Map a generic FeedQuery into adapter search + ranking (optional). */
  feed?(query: FeedQuery): Promise<Paged<Product>>;
}

export interface MarketplaceConfig {
  mode: 'mock' | 'live';
  mercadoLivre: { appId?: string; clientSecret?: string; affiliateId?: string; accessToken?: string };
  shopee: { appId?: string; appSecret?: string; affiliateId?: string };
  amazon: { accessKey?: string; secretKey?: string; partnerTag?: string; region?: string };
}

/** True when at least the affiliate identity needed for live linking exists. */
export function hasMercadoLivreCredentials(c: MarketplaceConfig): boolean {
  return Boolean(c.mercadoLivre.affiliateId || c.mercadoLivre.accessToken);
}
export function hasShopeeCredentials(c: MarketplaceConfig): boolean {
  return Boolean(c.shopee.affiliateId && c.shopee.appId);
}
export function hasAmazonCredentials(c: MarketplaceConfig): boolean {
  return Boolean(c.amazon.partnerTag && c.amazon.accessKey && c.amazon.secretKey);
}
