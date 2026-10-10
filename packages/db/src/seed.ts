import {
  centsToBRL,
  computeCommissionSplit,
  createAffiliateLink,
  generateReferralCode,
} from '@viraliza/core';
import { DEMO_CATALOG } from '@viraliza/marketplaces';
import { MemoryStore } from './memory';
import type { DataStore } from './store';

export interface SeedResult {
  user: Awaited<ReturnType<DataStore['createUser']>>;
  demoEmail: string;
  demoPasswordless: true;
}

/**
 * Seed a store with a demo account plus realistic history (links, sales,
 * wallet) so dashboards and the AI agent have something to show on first run.
 */
export async function seedDemoData(target: MemoryStore, appUrl = 'http://localhost:3000'): Promise<void> {
  const store: DataStore = target;

  // Demo affiliate (the account you log in as in dev).
  const user = await store.createUser({
    id: 'demo-user',
    name: 'Sérgio Demo',
    email: 'demo@viraliza.app',
    phone: '+5511999999999',
    referralCode: 'DEMO2026',
    plan: 'pro',
  });
  await store.updateUser(user.id, { balanceCents: 128_450, lifetimeEarningsCents: 341_900 });

  // A second user invited by the demo account (to show the referral flow).
  await store.createUser({
    id: 'demo-friend',
    name: 'Ana Afiliada',
    email: 'ana@viraliza.app',
    phone: '+5521988888888',
    referralCode: generateReferralCode('ANA'),
    referredBy: user.id,
    plan: 'free',
  });

  await store.upsertSubscription({
    userId: user.id,
    plan: 'pro',
    billing: 'monthly',
    status: 'active',
    provider: 'mock',
    currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000).toISOString(),
  });

  // Create a handful of real affiliate links from the demo catalog.
  const picks = DEMO_CATALOG.slice(0, 6);
  for (const product of picks) {
    const code = `demo${Math.random().toString(36).slice(2, 6)}`;
    const link = createAffiliateLink({
      id: `link-${product.externalId}`,
      code,
      userId: user.id,
      product,
      appUrl,
      affiliateTag: 'viraliza-demo',
      priceLabel: centsToBRL(product.priceCents),
    });
    await store.createLink({
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
    });

    // Simulate a completed sale on some links.
    if (Math.random() > 0.4) {
      const split = computeCommissionSplit({
        orderValueCents: product.priceCents,
        marketplace: product.marketplace,
        plan: 'pro',
        commissionPercent: product.commissionPercent,
      });
      const conversion = await store.createConversion({
        linkId: link.id,
        userId: user.id,
        marketplace: product.marketplace,
        orderValueCents: product.priceCents,
        grossCommissionCents: split.grossCommissionCents,
        platformFeeCents: split.platformFeeCents,
        netCommissionCents: split.netCommissionCents,
        referralBonusCents: 0,
        status: 'approved',
      });
      await store.applyConversionToLink(link.id, split.netCommissionCents);
      await store.addWalletEntry({
        userId: user.id,
        type: 'commission',
        amountCents: split.netCommissionCents,
        description: `Comissão — ${product.title.slice(0, 40)}`,
        refId: conversion.id,
      });
    }
  }

  await store.addWalletEntry({
    userId: user.id,
    type: 'payout',
    amountCents: -5000,
    description: 'Saque via PIX',
  });

  await store.upsertLead({
    phone: '+5511977777777',
    name: 'Cliente WhatsApp',
    optedIn: true,
    source: 'whatsapp',
  });
}

/** Build a fresh, seeded in-memory store (used by the web app and tests). */
export async function createSeededStore(appUrl = 'http://localhost:3000'): Promise<MemoryStore> {
  const memory = new MemoryStore();
  await seedDemoData(memory, appUrl);
  return memory;
}
