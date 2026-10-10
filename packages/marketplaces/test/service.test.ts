import { describe, expect, it } from 'vitest';
import { MarketplaceService } from '../src/service';
import type { MarketplaceConfig } from '../src/adapter';

const mockConfig: MarketplaceConfig = {
  mode: 'mock',
  mercadoLivre: {},
  shopee: {},
  amazon: {},
};

describe('MarketplaceService (mock mode)', () => {
  const service = new MarketplaceService(mockConfig);

  it('reports every marketplace as not-live without credentials', () => {
    const status = service.status();
    expect(status.mercadolivre.live).toBe(false);
    expect(status.shopee.live).toBe(false);
    expect(status.amazon.live).toBe(false);
  });

  it('returns a ranked, cross-marketplace viral feed', async () => {
    const feed = await service.feed({ limit: 24 });
    expect(feed.items.length).toBeGreaterThan(10);
    const marketplaces = new Set(feed.items.map((p) => p.marketplace));
    expect(marketplaces.size).toBe(3);
    for (const p of feed.items) {
      expect(p.viralScore).toBeGreaterThanOrEqual(0);
      expect(p.viralScore).toBeLessThanOrEqual(100);
      expect(p.estimatedNetCommissionCents).toBeGreaterThan(0);
    }
  });

  it('sorts by viral score by default', async () => {
    const feed = await service.feed({ limit: 10 });
    const scores = feed.items.map((p) => p.viralScore);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('filters by marketplace and search term', async () => {
    const feed = await service.feed({ marketplace: 'shopee', query: 'fone', limit: 10 });
    expect(feed.items.every((p) => p.marketplace === 'shopee')).toBe(true);
    const hits = await service.search('airfryer');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]!.title.toLowerCase()).toContain('air');
  });

  it('fetches a single product by composite id', async () => {
    const product = await service.getProduct('shopee:SPE10000001');
    expect(product).not.toBeNull();
    expect(product!.marketplace).toBe('shopee');
  });

  it('returns null for an unknown product id', async () => {
    expect(await service.getProduct('shopee:does-not-exist')).toBeNull();
  });
});
