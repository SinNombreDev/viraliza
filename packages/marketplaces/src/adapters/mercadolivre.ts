/**
 * Mercado Livre adapter (live).
 *
 * Live data comes from:
 *   • the public Mercado Livre search API for product metadata, and
 *   • the Mercado Livre Afiliados API for minted tracked links.
 *
 * Credentials are read from MarketplaceConfig. When they are missing the
 * aggregator falls back to the mock adapter, so this class can stay focused on
 * the real integration.
 *
 * NOTE: endpoint shapes follow the documented public API; verify against your
 * account's granted scopes before enabling live mode in production.
 */

import type { Paged, Product } from '@viraliza/core';
import type {
  AffiliateIdentityLike,
  AffiliateLinkResult,
  MarketplaceAdapter,
  MarketplaceConfig,
  SearchOptions,
  TrendingOptions,
} from '../adapter';

const SEARCH_BASE = 'https://api.mercadolibre.com';

interface MLItem {
  id: string;
  title: string;
  price: number;
  original_price?: number | null;
  permalink: string;
  thumbnail: string;
  category_id?: string;
  sold_quantity?: number;
  condition?: string;
}

interface MLSearchResponse {
  results: MLItem[];
  paging?: { total: number; offset: number; limit: number };
}

export class MercadoLivreAdapter implements MarketplaceAdapter {
  readonly id = 'mercadolivre' as const;
  readonly live = true;

  constructor(private readonly config: MarketplaceConfig) {}

  private get token(): string {
    return this.config.mercadoLivre.accessToken ?? '';
  }

  async search(query: string, options: SearchOptions = {}): Promise<Paged<Product>> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    const url = new URL(`${SEARCH_BASE}/sites/MLB/search`);
    url.searchParams.set('q', query);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));
    if (options.minPriceCents) url.searchParams.set('price', `${options.minPriceCents / 100}-*`);
    if (options.maxPriceCents) {
      const min = options.minPriceCents ? options.minPriceCents / 100 : 0;
      url.searchParams.set('price', `${min}-${options.maxPriceCents / 100}`);
    }

    const res = await fetch(url, { headers: this.authHeaders() });
    if (!res.ok) throw new Error(`Mercado Livre search failed: ${res.status}`);
    const data = (await res.json()) as MLSearchResponse;

    const items = (data.results ?? []).map((r) => this.mapItem(r));
    const total = data.paging?.total ?? items.length;
    const next = offset + limit < total ? String(offset + limit) : null;
    return { items, nextCursor: next, total };
  }

  async getProduct(externalId: string): Promise<Product | null> {
    const res = await fetch(`${SEARCH_BASE}/items/${externalId}`, { headers: this.authHeaders() });
    if (!res.ok) return null;
    const item = (await res.json()) as MLItem;
    return this.mapItem(item);
  }

  async trending(options: TrendingOptions = {}): Promise<Product[]> {
    // Public highlights endpoint; ranked by Viraliza afterwards.
    const url = new URL(`${SEARCH_BASE}/sites/MLB/search`);
    url.searchParams.set('q', options.category ?? 'mais vendidos');
    url.searchParams.set('sort', 'sold_quantity_desc');
    url.searchParams.set('limit', String(options.limit ?? 10));
    const res = await fetch(url, { headers: this.authHeaders() });
    if (!res.ok) throw new Error(`Mercado Livre trending failed: ${res.status}`);
    const data = (await res.json()) as MLSearchResponse;
    return (data.results ?? []).map((r) => this.mapItem(r));
  }

  async mintAffiliateLink(product: Product, identity: AffiliateIdentityLike): Promise<AffiliateLinkResult> {
    // Mercado Livre Afiliados generates the tracked URL server-side.
    const res = await fetch(`${SEARCH_BASE}/affiliate/links`, {
      method: 'POST',
      headers: { ...this.authHeaders(), 'content-type': 'application/json' },
      body: JSON.stringify({
        url: product.url,
        affiliate_id: this.config.mercadoLivre.affiliateId,
        sub_id: `${identity.userId}-${identity.linkCode}`,
      }),
    });
    if (!res.ok) throw new Error(`Mercado Livre link minting failed: ${res.status}`);
    const data = (await res.json()) as { short_url?: string; url?: string };
    return { shortUrl: data.short_url, destinationUrl: data.url };
  }

  private mapItem(r: MLItem): Product {
    return {
      id: `mercadolivre:${r.id}`,
      marketplace: 'mercadolivre',
      externalId: r.id,
      title: r.title,
      description: r.title,
      imageUrl: r.thumbnail?.replace('http://', 'https://') ?? '',
      category: r.category_id ?? 'Geral',
      priceCents: Math.round((r.price ?? 0) * 100),
      originalPriceCents: r.original_price ? Math.round(r.original_price * 100) : undefined,
      currency: 'BRL',
      rating: 0,
      reviewsCount: 0,
      salesCount: r.sold_quantity ?? 0,
      url: r.permalink,
      trending: false,
      tags: [],
      syncedAt: new Date().toISOString(),
    };
  }

  private authHeaders(): Record<string, string> {
    return this.token ? { authorization: `Bearer ${this.token}` } : {};
  }
}
