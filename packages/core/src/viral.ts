/**
 * Viral scoring — turns raw marketplace metadata into a single 0-100 number
 * that answers "how likely is this to be bought right now?".
 *
 * The score blends four signals:
 *   • Sales velocity       — how many units are moving.
 *   • Social proof         — rating × number of reviews.
 *   • Price attractiveness — discount off the original price.
 *   • Momentum             — marketplace "trending" flag + freshness.
 *
 * Every factor also emits a human-readable reason, which the AI agent weaves
 * into its sales copy ("já vendeu 12 mil, 4,9 estrelas, 40% de desconto").
 */

import { percentOfCents } from './money';
import type { MarketplaceId, PlanId, Product, RankedProduct } from './types';
import { estimateNetCommissionCents } from './commission';

const MARKETPLACE_MOMENTUM: Record<MarketplaceId, number> = {
  shopee: 1.08,
  mercadolivre: 1.0,
  amazon: 0.96,
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

/** Log-ish scale so a product with 100k sales isn't 1000x a product with 100. */
function salesSignal(salesCount: number): number {
  if (salesCount <= 0) return 0;
  return clamp(Math.log10(salesCount + 1) / 4); // 10k sales ≈ 1.0
}

function socialSignal(rating: number, reviewsCount: number): number {
  const ratingPart = clamp(rating / 5);
  const volumePart = clamp(Math.log10(reviewsCount + 1) / 3.5);
  return clamp(ratingPart * 0.6 + volumePart * 0.4);
}

function discountSignal(discountPercent: number): number {
  return clamp(discountPercent / 40); // a 40%+ discount maxes this out
}

function momentumSignal(product: Product): number {
  let s = product.trending ? 0.7 : 0.35;
  const ageHours = (Date.now() - Date.parse(product.syncedAt || '0')) / 3_600_000;
  if (Number.isFinite(ageHours)) {
    // Fresher syncs score higher, decaying over ~48h.
    s += clamp(0.3 * (1 - ageHours / 48));
  }
  return clamp(s);
}

function discountPercentOf(product: Product): number {
  if (!product.originalPriceCents || product.originalPriceCents <= product.priceCents) return 0;
  return Math.round(((product.originalPriceCents - product.priceCents) / product.originalPriceCents) * 100);
}

/**
 * Score a product 0-100 with explanatory reasons.
 */
export function rankProduct(product: Product, plan?: PlanId): RankedProduct {
  const discountPercent = discountPercentOf(product);

  const sSales = salesSignal(product.salesCount);
  const sSocial = socialSignal(product.rating, product.reviewsCount);
  const sDiscount = discountSignal(discountPercent);
  const sMomentum = momentumSignal(product);

  // Weighted blend → 0..1
  let score01 = sSales * 0.34 + sSocial * 0.24 + sDiscount * 0.22 + sMomentum * 0.2;

  // Marketplace momentum multiplier.
  score01 *= MARKETPLACE_MOMENTUM[product.marketplace] ?? 1;

  const viralScore = Math.round(clamp(score01, 0, 1) * 100);

  const reasons: string[] = [];
  if (product.salesCount >= 1000) reasons.push(`${formatCompact(product.salesCount)} vendidos`);
  if (product.rating >= 4.5) reasons.push(`${product.rating.toFixed(1)}★`);
  if (product.reviewsCount >= 500) reasons.push(`${formatCompact(product.reviewsCount)} avaliações`);
  if (discountPercent >= 15) reasons.push(`${discountPercent}% OFF`);
  if (product.trending) reasons.push('tendência do momento');
  if (reasons.length === 0) reasons.push('boa oportunidade');

  const estimatedNetCommissionCents = estimateNetCommissionCents({
    priceCents: product.priceCents,
    marketplace: product.marketplace,
    plan,
    commissionPercent: product.commissionPercent,
  });

  return {
    ...product,
    viralScore,
    viralReasons: reasons,
    discountPercent,
    estimatedNetCommissionCents,
  };
}

export function rankProducts(products: Product[], plan?: PlanId): RankedProduct[] {
  return products.map((p) => rankProduct(p, plan));
}

/** Compact pt-BR number formatting: 1200 → "1,2 mil", 1_200_000 → "1,2 mi". */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} mi`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.', ',')} mil`;
  return String(n);
}

/** Sort helpers for the feed. */
export function sortProducts<T extends RankedProduct>(items: T[], sort: string): T[] {
  const copy = [...items];
  switch (sort) {
    case 'sales':
      return copy.sort((a, b) => b.salesCount - a.salesCount);
    case 'commission':
      return copy.sort((a, b) => b.estimatedNetCommissionCents - a.estimatedNetCommissionCents);
    case 'discount':
      return copy.sort((a, b) => b.discountPercent - a.discountPercent);
    case 'price_asc':
      return copy.sort((a, b) => a.priceCents - b.priceCents);
    case 'price_desc':
      return copy.sort((a, b) => b.priceCents - a.priceCents);
    case 'viral':
    default:
      return copy.sort((a, b) => b.viralScore - a.viralScore);
  }
}

export { percentOfCents };
