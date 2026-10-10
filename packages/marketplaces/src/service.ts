import type { FeedQuery, MarketplaceId, Paged, Product, RankedProduct } from '@viraliza/core';
import { MARKETPLACES, rankProducts, sortProducts } from '@viraliza/core';
import {
  hasAmazonCredentials,
  hasMercadoLivreCredentials,
  hasShopeeCredentials,
  type MarketplaceAdapter,
  type MarketplaceConfig,
} from './adapter';
import { AmazonAdapter } from './adapters/amazon';
import { MercadoLivreAdapter } from './adapters/mercadolivre';
import { ShopeeAdapter } from './adapters/shopee';
import { MockMarketplaceAdapter } from './mock/adapter';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/** Tiny in-memory TTL cache so a burst of feed requests doesn't hammer APIs. */
class TtlCache {
  private store = new Map<string, CacheEntry<unknown>>();
  constructor(private readonly ttlMs: number) {}
  get<T>(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value as T;
  }
  set<T>(key: string, value: T): T {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    return value;
  }
  async wrap<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const hit = this.get<T>(key);
    if (hit !== undefined) return hit;
    return this.set(key, await fn());
  }
}

/**
 * MarketplaceService — the single entry point the app talks to.
 *
 * It resolves one adapter per marketplace (live when credentials exist, mock
 * otherwise), aggregates their results, applies Viraliza's viral ranking and
 * serves the cross-marketplace "feed" that powers the home screen.
 */
export class MarketplaceService {
  private readonly adapters: Record<MarketplaceId, MarketplaceAdapter>;
  private readonly cache = new TtlCache(60_000);

  constructor(private readonly config: MarketplaceConfig) {
    this.adapters = {
      mercadolivre:
        config.mode === 'live' && hasMercadoLivreCredentials(config)
          ? new MercadoLivreAdapter(config)
          : new MockMarketplaceAdapter('mercadolivre'),
      shopee:
        config.mode === 'live' && hasShopeeCredentials(config)
          ? new ShopeeAdapter(config)
          : new MockMarketplaceAdapter('shopee'),
      amazon:
        config.mode === 'live' && hasAmazonCredentials(config)
          ? new AmazonAdapter(config)
          : new MockMarketplaceAdapter('amazon'),
    };
  }

  /** Which marketplaces are currently live vs mocked (shown in the UI). */
  status(): Record<MarketplaceId, { live: boolean }> {
    return Object.fromEntries(MARKETPLACES.map((m) => [m, { live: this.adapters[m].live }])) as Record<
      MarketplaceId,
      { live: boolean }
    >;
  }

  adapter(id: MarketplaceId): MarketplaceAdapter {
    return this.adapters[id];
  }

  /**
   * The cross-marketplace viral feed. Fetches from every selected marketplace,
   * ranks each product, de-duplicates, filters and sorts, then paginates.
   */
  async feed(query: FeedQuery = {}): Promise<Paged<RankedProduct>> {
    const limit = Math.min(query.limit ?? 20, 60);
    const marketplaces: MarketplaceId[] =
      !query.marketplace || query.marketplace === 'all' ? MARKETPLACES : [query.marketplace];

    const cacheKey = JSON.stringify({ ...query, marketplaces });
    const ranked = await this.cache.wrap(cacheKey, async () => {
      const hasQuery = Boolean(query.query && query.query.trim());
      const pages = await Promise.all(
        marketplaces.map(async (m) => {
          const searchResults = await this.adapters[m]
            .search(query.query ?? '', {
              limit: 40,
              category: query.category && query.category !== 'all' ? query.category : undefined,
              minPriceCents: query.minPriceCents,
              maxPriceCents: query.maxPriceCents,
            })
            .then((page) => page.items)
            .catch(() => [] as Product[]);

          // Only blend in "trending" when browsing (no text query), otherwise
          // the results must actually match what the user searched for.
          if (hasQuery) return searchResults;
          const hot = await this.adapters[m]
            .trending({ limit: 6, category: query.category !== 'all' ? query.category : undefined })
            .catch(() => [] as Product[]);
          return [...searchResults, ...hot];
        }),
      );

      const all = pages.flat();
      const seen = new Set<string>();
      const unique = all.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));

      let ranked = rankProducts(unique);
      ranked = applyFilters(ranked, query);
      return sortProducts(ranked, query.sort ?? 'viral');
    });

    const offset = query.cursor ? Number(query.cursor) || 0 : 0;
    const items = ranked.slice(offset, offset + limit);
    const nextCursor = offset + limit < ranked.length ? String(offset + limit) : null;
    return { items, nextCursor, total: ranked.length };
  }

  async search(query: string, options?: { limit?: number }): Promise<RankedProduct[]> {
    return (await this.feed({ query, limit: options?.limit ?? 20 })).items;
  }

  async trending(options: { limit?: number; marketplace?: MarketplaceId } = {}): Promise<RankedProduct[]> {
    return (await this.feed({ sort: 'viral', limit: options.limit ?? 20, marketplace: options.marketplace })).items;
  }

  async getProduct(id: string): Promise<RankedProduct | null> {
    const [marketplace, externalId] = id.split(':') as [MarketplaceId, string];
    if (!marketplace || !externalId) return null;
    const adapter = this.adapters[marketplace];
    if (!adapter) return null;
    const product = await adapter.getProduct(externalId);
    if (!product) return null;
    return rankProducts([product])[0]!;
  }

  /** Product detail by external id within one marketplace. */
  async getProductByMarketplace(marketplace: MarketplaceId, externalId: string): Promise<RankedProduct | null> {
    return this.getProduct(`${marketplace}:${externalId}`);
  }
}

function applyFilters(items: RankedProduct[], query: FeedQuery): RankedProduct[] {
  let out = items;
  if (query.minPriceCents) out = out.filter((p) => p.priceCents >= query.minPriceCents!);
  if (query.maxPriceCents) out = out.filter((p) => p.priceCents <= query.maxPriceCents!);
  if (query.category && query.category !== 'all') out = out.filter((p) => p.category === query.category);
  return out;
}

/** Convenience factory using environment-derived config. */
export function createMarketplaceService(config: MarketplaceConfig): MarketplaceService {
  return new MarketplaceService(config);
}
