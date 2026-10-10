/**
 * Business rules: fees, plans and the commission split.
 *
 * The numbers here are the product's commercial model. They are deliberately
 * centralised so they can be tuned (or later loaded from config/DB) without
 * touching the rest of the codebase.
 */

import type { MarketplaceId, Plan, PlanId } from './types';

export interface PricingConfig {
  /** Viraliza's cut of the gross affiliate commission (percent). */
  platformFeePercent: number;
  /** Fallback commission rate when the marketplace gives us none (percent). */
  defaultCommissionPercent: number;
  /** Referral bonus paid to the inviter, as percent of the invitee's net. */
  referralPercent: number;
  /** Minimum payout amount (centavos). */
  minPayoutCents: number;
  currency: 'BRL';
}

export const DEFAULT_PRICING: PricingConfig = {
  platformFeePercent: 20,
  defaultCommissionPercent: 8,
  referralPercent: 5,
  minPayoutCents: 5000,
  currency: 'BRL',
};

/**
 * Commission rates per marketplace (percent of order value). Used when a
 * product/adapter does not carry its own rate. These reflect typical public
 * affiliate programme ranges and are safe defaults until real API data flows in.
 */
export const MARKETPLACE_COMMISSION_DEFAULTS: Record<MarketplaceId, number> = {
  mercadolivre: 7,
  shopee: 14,
  amazon: 6,
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Grátis',
    description: 'Comece a viralizar sem custo.',
    billing: 'monthly',
    priceCents: 0,
    features: [
      'Até 5 links ativos',
      'Feed viral de produtos',
      'Compartilhamento no WhatsApp',
      'Agente de IA (20 mensagens/mês)',
    ],
    maxActiveLinks: 5,
    platformFeePercent: 20,
    aiAgent: true,
    whatsappAutomation: false,
    priorityFeed: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Para quem vende todos os dias.',
    billing: 'monthly',
    priceCents: 2990,
    features: [
      'Links ilimitados',
      'Agente de IA ilimitado',
      'Broadcast automático no WhatsApp',
      'Prioridade no feed viral',
      'Comissão Viraliza reduzida (15%)',
      'Saque via PIX',
    ],
    maxActiveLinks: null,
    platformFeePercent: 15,
    aiAgent: true,
    whatsappAutomation: true,
    priorityFeed: true,
  },
  business: {
    id: 'business',
    name: 'Business',
    description: 'Para times, criadores e agências.',
    billing: 'monthly',
    priceCents: 9990,
    features: [
      'Tudo do Pro',
      'Até 10 usuários na equipe',
      'Dashboard e relatórios avançados',
      'API de afiliados',
      'Comissão Viraliza reduzida (10%)',
      'Suporte prioritário',
    ],
    maxActiveLinks: null,
    platformFeePercent: 10,
    aiAgent: true,
    whatsappAutomation: true,
    priorityFeed: true,
  },
};

/** One-time lifetime unlock (alternative to subscription). */
export const ONE_TIME_PLAN: Plan = {
  id: 'pro',
  name: 'Pro Vitalício',
  description: 'Pague uma vez, use para sempre.',
  billing: 'one_time',
  priceCents: 19900,
  features: [
    'Tudo do Pro, para sempre',
    'Sem mensalidade',
    'Todos os updates futuros',
  ],
  maxActiveLinks: null,
  platformFeePercent: 15,
  aiAgent: true,
  whatsappAutomation: true,
  priorityFeed: true,
};

/** Fee (percent) Viraliza keeps for a given user plan. */
export function platformFeePercentFor(plan: PlanId | undefined): number {
  if (plan === 'pro') return PLANS.pro.platformFeePercent;
  if (plan === 'business') return PLANS.business.platformFeePercent;
  return PLANS.free.platformFeePercent;
}

/** Commission rate (percent of order value) for a product. */
export function commissionPercentFor(
  marketplace: MarketplaceId,
  productPercent?: number,
): number {
  if (typeof productPercent === 'number' && productPercent > 0) return productPercent;
  return MARKETPLACE_COMMISSION_DEFAULTS[marketplace] ?? DEFAULT_PRICING.defaultCommissionPercent;
}
