import { describe, expect, it } from 'vitest';
import {
  buildDestinationUrl,
  buildShareText,
  buildWhatsAppShareUrl,
  centsToBRL,
  computeCommissionSplit,
  createAffiliateLink,
  generateShortCode,
  percentOfCents,
  rankProduct,
  type Product,
} from '../src/index';

const product: Product = {
  id: 'shopee:1',
  marketplace: 'shopee',
  externalId: '1',
  title: 'Fone Bluetooth XYZ',
  description: 'Fone sem fio',
  imageUrl: 'https://img/1.jpg',
  category: 'Eletrônicos',
  priceCents: 9990,
  originalPriceCents: 19990,
  currency: 'BRL',
  rating: 4.8,
  reviewsCount: 3200,
  salesCount: 12000,
  url: 'https://shopee.com.br/product/1/1',
  trending: true,
  syncedAt: new Date().toISOString(),
};

describe('money', () => {
  it('formats centavos as BRL', () => {
    expect(centsToBRL(9990)).toContain('99,90');
  });
  it('applies percentages with rounding', () => {
    expect(percentOfCents(10000, 20)).toBe(2000);
    expect(percentOfCents(999, 10)).toBe(100);
  });
});

describe('commission split', () => {
  it('keeps the platform fee and pays the user the net', () => {
    const split = computeCommissionSplit({
      orderValueCents: 10000, // R$100
      marketplace: 'shopee',
      plan: 'pro',
      commissionPercent: 10,
    });
    expect(split.grossCommissionCents).toBe(1000); // 10% of R$100
    expect(split.platformFeePercent).toBe(15); // pro plan
    expect(split.platformFeeCents).toBe(150);
    expect(split.netCommissionCents).toBe(850); // user gets R$8.50
    expect(split.platformNetCents).toBe(150);
  });

  it('pays a referral bonus to the inviter', () => {
    const split = computeCommissionSplit({
      orderValueCents: 10000,
      marketplace: 'shopee',
      plan: 'free',
      commissionPercent: 10,
      hasReferrer: true,
    });
    expect(split.netCommissionCents).toBe(800); // free plan: 20% platform fee
    expect(split.referralBonusCents).toBe(40); // 5% of 800
    expect(split.platformNetCents).toBe(160); // 200 - 40
  });

  it('is a pure function (same input, same output)', () => {
    const a = computeCommissionSplit({ orderValueCents: 5000, marketplace: 'amazon', plan: 'free' });
    const b = computeCommissionSplit({ orderValueCents: 5000, marketplace: 'amazon', plan: 'free' });
    expect(a).toEqual(b);
  });
});

describe('viral scoring', () => {
  it('scores a hot product highly and explains why', () => {
    const ranked = rankProduct(product, 'pro');
    expect(ranked.viralScore).toBeGreaterThan(60);
    expect(ranked.discountPercent).toBe(50);
    expect(ranked.viralReasons.join(' ')).toContain('12,0 mil vendidos');
    expect(ranked.estimatedNetCommissionCents).toBeGreaterThan(0);
  });

  it('caps the score at 100', () => {
    const maxed = rankProduct({ ...product, salesCount: 10_000_000, reviewsCount: 10_000_000, rating: 5, trending: true });
    expect(maxed.viralScore).toBeLessThanOrEqual(100);
  });
});

describe('link building', () => {
  it('generates unique, URL-safe short codes', () => {
    const codes = new Set(Array.from({ length: 500 }, () => generateShortCode(8)));
    expect(codes.size).toBe(500);
    for (const c of codes) expect(c).toMatch(/^[A-Za-z0-9]{8}$/);
  });

  it('injects tracking params per marketplace', () => {
    const ml = buildDestinationUrl(
      { marketplace: 'mercadolivre', url: 'https://produto.mercadolivre.com.br/MLB-1', externalId: 'MLB-1' },
      { affiliateTag: 'viraliza', userId: 'u1', linkCode: 'abc' },
    );
    expect(ml).toContain('matt_word=viraliza');
    expect(ml).toContain('viraliza_uid=u1');

    const amz = buildDestinationUrl(
      { marketplace: 'amazon', url: 'https://www.amazon.com.br/dp/B0', externalId: 'B0' },
      { affiliateTag: 'mytag-20', userId: 'u1', linkCode: 'abc' },
    );
    expect(amz).toContain('tag=mytag-20');

    const shp = buildDestinationUrl(
      { marketplace: 'shopee', url: 'https://shopee.com.br/product/1/1', externalId: '1' },
      { affiliateTag: 'aff1', userId: 'u1', linkCode: 'abc' },
    );
    expect(shp).toContain('originUrl=');
    expect(shp).toContain('affiliateId=aff1');
  });

  it('creates a complete shareable link with WhatsApp copy', () => {
    const link = createAffiliateLink({
      id: 'l1',
      code: 'Ab3xY9',
      userId: 'u1',
      product,
      appUrl: 'https://viraliza.app',
      affiliateTag: 'aff1',
      priceLabel: centsToBRL(product.priceCents),
    });
    expect(link.whatsappShareUrl).toContain('https://wa.me/');
    expect(link.destinationUrl).toContain('originUrl=');
    expect(link.code).toBe('Ab3xY9');
  });

  it('builds pt-BR share copy with link and scarcity', () => {
    const text = buildShareText({
      product,
      shortUrl: 'https://viraliza.app/r/Ab3xY9',
      priceLabel: 'R$ 99,90',
      discountPercent: 50,
    });
    expect(text).toContain('Fone Bluetooth XYZ');
    expect(text).toContain('50% de desconto');
    expect(text).toContain('https://viraliza.app/r/Ab3xY9');
    expect(text).toContain('⏰');
  });

  it('builds a wa.me link with prefilled text', () => {
    const url = buildWhatsAppShareUrl('Oi', '+5511999999999');
    expect(url.startsWith('https://wa.me/5511999999999')).toBe(true);
    expect(url).toContain(encodeURIComponent('Oi'));
  });
});
