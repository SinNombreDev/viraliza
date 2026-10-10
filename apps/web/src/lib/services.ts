/**
 * Server services — the wiring layer that joins the packages together.
 * Route handlers and server components call these; they never touch adapters
 * or the store directly, which keeps the integration surface in one place.
 */

import {
  centsToBRL,
  computeCommissionSplit,
  createAffiliateLink,
  generateShortCode,
  type AffiliateLink,
  type FeedQuery,
  type MarketplaceId,
  type Paged,
  type RankedProduct,
  type User,
} from '@viraliza/core';
import { MarketplaceService, loadMarketplaceConfig } from '@viraliza/marketplaces';
import { SalesAgent, createProvider, type CreatedLink } from '@viraliza/ai';
import { createWhatsAppProvider, type WhatsAppProvider } from '@viraliza/whatsapp';
import type { DataStore } from '@viraliza/db';
import { appConfig } from './config';
import { getStore } from './store';

// ── Singletons ────────────────────────────────────────────────────────────────
const globalForServices = globalThis as unknown as {
  __viralizaMarketplace?: MarketplaceService;
  __viralizaWhatsApp?: WhatsAppProvider;
  __viralizaAi?: ReturnType<typeof createProvider>;
};

export function getMarketplaceService(): MarketplaceService {
  if (!globalForServices.__viralizaMarketplace) {
    globalForServices.__viralizaMarketplace = new MarketplaceService(loadMarketplaceConfig());
  }
  return globalForServices.__viralizaMarketplace;
}

export function getWhatsApp(): WhatsAppProvider {
  if (!globalForServices.__viralizaWhatsApp) {
    globalForServices.__viralizaWhatsApp = createWhatsAppProvider({
      provider: appConfig.whatsapp.provider,
      phoneNumberId: appConfig.whatsapp.phoneNumberId,
      accessToken: appConfig.whatsapp.accessToken,
      verifyToken: appConfig.whatsapp.verifyToken,
      businessAccountId: appConfig.whatsapp.businessAccountId,
    });
  }
  return globalForServices.__viralizaWhatsApp;
}

function getAiProvider() {
  if (!globalForServices.__viralizaAi) {
    globalForServices.__viralizaAi = createProvider({
      provider: appConfig.ai.provider,
      model: appConfig.ai.model,
      openaiApiKey: appConfig.ai.openaiApiKey,
      azure: appConfig.ai.azure,
    });
  }
  return globalForServices.__viralizaAi;
}

// ── Feed ──────────────────────────────────────────────────────────────────────
export function getFeed(query: FeedQuery): Promise<Paged<RankedProduct>> {
  return getMarketplaceService().feed(query);
}

export function getProduct(id: string): Promise<RankedProduct | null> {
  return getMarketplaceService().getProduct(id);
}

// ── Links ─────────────────────────────────────────────────────────────────────
export class PlanLimitError extends Error {}
export class ProductNotFoundError extends Error {}

/** Create (and persist) a shareable affiliate link for a user. */
export async function createLinkForUser(userId: string, productId: string): Promise<AffiliateLink> {
  const store: DataStore = await getStore();
  const user = await store.getUser(userId);
  if (!user) throw new PlanLimitError('Usuário não encontrado.');

  const product = await getMarketplaceService().getProduct(productId);
  if (!product) throw new ProductNotFoundError('Produto não encontrado.');

  const { PLANS } = await import('@viraliza/core');
  const maxActive = PLANS[user.plan].maxActiveLinks;
  if (maxActive !== null) {
    const count = await store.countActiveLinks(userId);
    if (count >= maxActive) {
      throw new PlanLimitError(
        `Seu plano ${PLANS[user.plan].name} permite até ${maxActive} links ativos. Faça upgrade para links ilimitados.`,
      );
    }
  }

  const code = await uniqueCode(store);
  const affiliateTag = appConfig.affiliateTags[product.marketplace];

  const link = createAffiliateLink({
    id: code,
    code,
    userId,
    product,
    appUrl: appConfig.appUrl,
    affiliateTag,
    priceLabel: centsToBRL(product.priceCents),
  });

  return store.createLink({
    id: link.id,
    code: link.code,
    userId: link.userId,
    productId: link.productId,
    marketplace: link.marketplace,
    title: link.title,
    imageUrl: link.imageUrl,
    priceCents: product.priceCents,
    destinationUrl: link.destinationUrl,
    whatsappShareUrl: link.whatsappShareUrl,
    providerShortUrl: link.providerShortUrl,
  });
}

async function uniqueCode(store: DataStore): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateShortCode(8);
    if (!(await store.getLinkByCode(code))) return code;
  }
  return generateShortCode(12);
}

export function listLinks(userId: string): Promise<AffiliateLink[]> {
  return getStore().then((s) => s.listLinksByUser(userId));
}

// ── Conversions ───────────────────────────────────────────────────────────────
export interface ConversionInput {
  code: string;
  orderValueCents: number;
  marketplace?: MarketplaceId;
  externalOrderId?: string;
  commissionPercent?: number;
}

/**
 * Record a sale reported by a marketplace (via postback/webhook) and split the
 * money: platform fee, affiliate net, referral bonus. Idempotency by order id is
 * enforced by the caller/store in production.
 */
export async function recordConversion(input: ConversionInput) {
  const store = await getStore();
  const link = await store.getLinkByCode(input.code);
  if (!link) throw new ProductNotFoundError(`Link ${input.code} não encontrado.`);

  const user = await store.getUser(link.userId);
  if (!user) throw new ProductNotFoundError('Dono do link não encontrado.');

  const plan = user.plan;
  const hasReferrer = Boolean(user.referredBy);
  const split = computeCommissionSplit({
    orderValueCents: input.orderValueCents,
    marketplace: input.marketplace ?? link.marketplace,
    plan,
    commissionPercent: input.commissionPercent,
    hasReferrer,
  });

  const conversion = await store.createConversion({
    linkId: link.id,
    userId: user.id,
    marketplace: link.marketplace,
    externalOrderId: input.externalOrderId,
    orderValueCents: split.orderValueCents,
    grossCommissionCents: split.grossCommissionCents,
    platformFeeCents: split.platformFeeCents,
    netCommissionCents: split.netCommissionCents,
    referralBonusCents: split.referralBonusCents,
    status: 'approved',
  });

  await store.applyConversionToLink(link.id, split.netCommissionCents);
  await store.addWalletEntry({
    userId: user.id,
    type: 'commission',
    amountCents: split.netCommissionCents,
    description: `Comissão — ${link.title.slice(0, 40)}`,
    refId: conversion.id,
  });

  if (hasReferrer && user.referredBy && split.referralBonusCents > 0) {
    await store.addWalletEntry({
      userId: user.referredBy,
      type: 'referral_bonus',
      amountCents: split.referralBonusCents,
      description: `Bônus de indicação — ${user.name}`,
      refId: conversion.id,
    });
  }

  return { conversion, split };
}

// ── AI agent ──────────────────────────────────────────────────────────────────
export async function getAgent(userId?: string): Promise<SalesAgent> {
  const marketplace = getMarketplaceService();
  return new SalesAgent({
    provider: getAiProvider(),
    searchProducts: (query, limit) => marketplace.search(query, { limit }),
    createLink: userId
      ? async (productId: string): Promise<CreatedLink | null> => {
          try {
            const link = await createLinkForUser(userId, productId);
            const shareText = decodeShareText(link);
            return {
              code: link.code,
              shortUrl: `${appConfig.appUrl}/r/${link.code}`,
              destinationUrl: link.destinationUrl,
              shareText,
              whatsappShareUrl: link.whatsappShareUrl,
              productId: link.productId,
            };
          } catch {
            return null;
          }
        }
      : undefined,
  });
}

/** The share copy is embedded in the wa.me deep link; recover it for the UI. */
function decodeShareText(link: AffiliateLink): string {
  try {
    const url = new URL(link.whatsappShareUrl);
    return url.searchParams.get('text') ?? `${link.title}\n${appConfig.appUrl}/r/${link.code}`;
  } catch {
    return `${link.title}\n${appConfig.appUrl}/r/${link.code}`;
  }
}

// ── Wallet summary ────────────────────────────────────────────────────────────
export async function getWalletSummary(user: User) {
  const store = await getStore();
  const entries = await store.listWalletByUser(user.id);
  const conversions = await store.listConversionsByUser(user.id);
  const pendingCents = conversions
    .filter((c) => c.status === 'pending')
    .reduce((a, c) => a + c.netCommissionCents, 0);
  return {
    balanceCents: user.balanceCents,
    lifetimeCents: user.lifetimeEarningsCents,
    pendingCents,
    entries,
    conversions,
  };
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export async function getDashboardStats(user: User) {
  const store = await getStore();
  const links = await store.listLinksByUser(user.id);
  const conversions = await store.listConversionsByUser(user.id);
  const clicks = links.reduce((a, l) => a + l.clicks, 0);
  const sales = conversions.length;
  const earned = conversions.reduce((a, c) => a + c.netCommissionCents, 0);
  const conversionRate = clicks > 0 ? (sales / clicks) * 100 : 0;
  return {
    linksCount: links.length,
    clicks,
    sales,
    earnedCents: earned,
    balanceCents: user.balanceCents,
    conversionRate,
  };
}
