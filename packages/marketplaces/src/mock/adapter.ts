import type { FeedQuery, MarketplaceId, Paged, Product } from '@viraliza/core';
import { rankProducts, sortProducts } from '@viraliza/core';
import type { MarketplaceAdapter, SearchOptions, TrendingOptions } from '../adapter';
import { DEMO_CATALOG } from './catalog';

function paginate(items: Product[], limit: number, offset: number): Paged<Product> {
  const start = offset;
  const slice = items.slice(start, start + limit);
  const next = start + limit < items.length ? String(start + limit) : null;
  return { items: slice, nextCursor: next, total: items.length };
}

/** In-memory adapter over the demo catalog. Always available, zero setup. */
export class MockMarketplaceAdapter implements MarketplaceAdapter {
  readonly live = false;
  constructor(readonly id: MarketplaceId) {}

  async search(query: string, options: SearchOptions = {}): Promise<Paged<Product>> {
    const q = query.trim().toLowerCase();
    let items = DEMO_CATALOG.filter((p) => p.marketplace === this.id);
    if (q) {
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.tags ?? []).some((t) => t.includes(q)),
      );
    }
    if (options.category) items = items.filter((p) => p.category === options.category);
    if (typeof options.minPriceCents === 'number') items = items.filter((p) => p.priceCents >= options.minPriceCents!);
    if (typeof options.maxPriceCents === 'number') items = items.filter((p) => p.priceCents <= options.maxPriceCents!);
    items = sortProducts(rankProducts(items), 'viral');
    return paginate(items, options.limit ?? 20, options.offset ?? 0);
  }

  async getProduct(externalId: string): Promise<Product | null> {
    return DEMO_CATALOG.find((p) => p.marketplace === this.id && p.externalId === externalId) ?? null;
  }

  async trending(options: TrendingOptions = {}): Promise<Product[]> {
    let items = DEMO_CATALOG.filter((p) => p.marketplace === this.id && p.trending);
    if (options.category) items = items.filter((p) => p.category === options.category);
    return sortProducts(rankProducts(items), 'viral').slice(0, options.limit ?? 10);
  }

  async feed(query: FeedQuery): Promise<Paged<Product>> {
    const page = await this.search(query.query ?? '', {
      limit: query.limit,
      category: query.category !== 'all' ? query.category : undefined,
      minPriceCents: query.minPriceCents,
      maxPriceCents: query.maxPriceCents,
    });
    const ranked = sortProducts(rankProducts(page.items), query.sort ?? 'viral');
    return { ...page, items: ranked };
  }
}
