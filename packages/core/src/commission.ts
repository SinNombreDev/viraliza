/**
 * Commission engine — the money math at the heart of Viraliza.
 *
 * Flow of one sale:
 *   1. A shopper buys through a Viraliza affiliate link.
 *   2. The marketplace pays Viraliza a GROSS commission (a % of the order).
 *   3. Viraliza keeps a PLATFORM FEE (a % of the gross).
 *   4. The affiliate (link owner) receives the NET commission.
 *   5. If the affiliate was invited by someone, the inviter receives a
 *      REFERRAL BONUS (a % of the affiliate's net).
 */

import { percentOfCents, roundCents } from './money';
import {
  DEFAULT_PRICING,
  commissionPercentFor,
  platformFeePercentFor,
  type PricingConfig,
} from './pricing';
import type { MarketplaceId, PlanId } from './types';

export interface CommissionSplit {
  orderValueCents: number;
  commissionPercent: number;
  grossCommissionCents: number;
  platformFeePercent: number;
  platformFeeCents: number;
  netCommissionCents: number;
  referralPercent: number;
  referralBonusCents: number;
  /** What Viraliza keeps after paying the affiliate AND the referrer. */
  platformNetCents: number;
}

export interface CommissionInput {
  orderValueCents: number;
  marketplace: MarketplaceId;
  /** User's plan — determines Viraliza's cut. */
  plan?: PlanId;
  /** Explicit commission rate from the marketplace, if known. */
  commissionPercent?: number;
  /** Whether the affiliate was referred by someone (unlocks the bonus). */
  hasReferrer?: boolean;
  /** Whether the plan grants commission discounts regardless of plan id. */
  config?: Partial<PricingConfig>;
}

/**
 * Compute the full, auditable split for a single sale. Pure function: same
 * inputs always produce the same output, which makes it trivial to unit-test
 * and to re-derive historical payouts.
 */
export function computeCommissionSplit(input: CommissionInput): CommissionSplit {
  const config: PricingConfig = { ...DEFAULT_PRICING, ...input.config };
  const orderValueCents = Math.max(0, roundCents(input.orderValueCents));

  const commissionPercent =
    input.commissionPercent && input.commissionPercent > 0
      ? input.commissionPercent
      : commissionPercentFor(input.marketplace, undefined);

  const grossCommissionCents = percentOfCents(orderValueCents, commissionPercent);

  const platformFeePercent = platformFeePercentFor(input.plan);
  const platformFeeCents = percentOfCents(grossCommissionCents, platformFeePercent);

  const netCommissionCents = Math.max(0, grossCommissionCents - platformFeeCents);

  const referralPercent = input.hasReferrer ? config.referralPercent : 0;
  const referralBonusCents = percentOfCents(netCommissionCents, referralPercent);

  const platformNetCents = grossCommissionCents - netCommissionCents - referralBonusCents;

  return {
    orderValueCents,
    commissionPercent,
    grossCommissionCents,
    platformFeePercent,
    platformFeeCents,
    netCommissionCents,
    referralPercent,
    referralBonusCents,
    platformNetCents,
  };
}

/**
 * Estimate what an affiliate would earn if a product sells once, from the
 * product's price. Used to rank the feed by "most profitable to share".
 */
export function estimateNetCommissionCents(params: {
  priceCents: number;
  marketplace: MarketplaceId;
  plan?: PlanId;
  commissionPercent?: number;
}): number {
  return computeCommissionSplit({
    orderValueCents: params.priceCents,
    marketplace: params.marketplace,
    plan: params.plan,
    commissionPercent: params.commissionPercent,
  }).netCommissionCents;
}

/**
 * Project earnings for a target number of sales — powers "you could earn R$X"
 * copy in the UI and in the AI agent.
 */
export function projectEarnings(params: {
  priceCents: number;
  marketplace: MarketplaceId;
  plan?: PlanId;
  sales: number;
  commissionPercent?: number;
}): { perSaleCents: number; totalCents: number } {
  const perSaleCents = estimateNetCommissionCents(params);
  return { perSaleCents, totalCents: perSaleCents * Math.max(0, params.sales) };
}
