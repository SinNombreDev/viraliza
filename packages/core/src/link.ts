/**
 * Affiliate link building + short-code generation.
 *
 * Viraliza does NOT proxy purchases. Each link points straight at the
 * marketplace, carrying the user's affiliate id and Viraliza tracking params
 * (the `subid`/`utm`), so attributing a sale back to the right user is the
 * marketplace's job plus our webhook reconciliation.
 */

import type { AffiliateLink, MarketplaceId, Product } from './types';

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'; // no ambiguous chars

/** Cryptographically-strong short code (8 chars ≈ 2^48). */
export function generateShortCode(length = 8): string {
  const bytes = new Uint8Array(length);
  const g = globalThis as { crypto?: { getRandomValues?: (b: Uint8Array) => Uint8Array } };
  if (g.crypto?.getRandomValues) {
    g.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

/** Public invite code, e.g. "SERGIO7X". */
export function generateReferralCode(seed?: string): string {
  const base = (seed ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 6) || 'USER';
  return `${base}${generateShortCode(4).toUpperCase()}`;
}

export interface AffiliateIdentity {
  /** The user's affiliate id / tracking tag on the marketplace. */
  affiliateTag: string;
  /** Viraliza user id, used as the sub-id for attribution. */
  userId: string;
  /** Viraliza link code, used as the sub-id for attribution. */
  linkCode: string;
  /** Campaign label for analytics. */
  campaign?: string;
}

/**
 * Build the final destination URL for a product, injecting the affiliate tag
 * and tracking params appropriate to each marketplace.
 */
export function buildDestinationUrl(
  product: Pick<Product, 'marketplace' | 'url' | 'externalId'>,
  identity: AffiliateIdentity,
): string {
  const url = new URL(product.url);
  const subId = `${identity.userId}-${identity.linkCode}`;

  switch (product.marketplace) {
    case 'mercadolivre': {
      // Mercado Livre affiliate links are minted via the ML API; the tracking
      // tag + matt_subid are appended so the click reconciles to the user.
      url.searchParams.set('matt_tool', 'viraliza');
      url.searchParams.set('matt_word', identity.affiliateTag);
      url.searchParams.set('matt_subid', subId);
      break;
    }
    case 'shopee': {
      // Shopee affiliate uses an /affiliate/deeplink gateway; the raw product
      // URL is the `originUrl` and our sub-id rides in `subId`.
      const gateway = new URL('https://shopee.com.br/affiliate');
      gateway.searchParams.set('originUrl', url.toString());
      gateway.searchParams.set('affiliateId', identity.affiliateTag);
      gateway.searchParams.set('subId', subId);
      return gateway.toString();
    }
    case 'amazon': {
      url.searchParams.set('tag', identity.affiliateTag);
      url.searchParams.set('linkCode', 'll2');
      url.searchParams.set('ref_', 'as_li_ss_tl');
      url.searchParams.set('ascsubtag', subId);
      break;
    }
  }

  url.searchParams.set('utm_source', 'viraliza');
  url.searchParams.set('utm_medium', 'affiliate');
  url.searchParams.set('utm_campaign', identity.campaign ?? product.marketplace);
  url.searchParams.set('viraliza_uid', identity.userId);
  url.searchParams.set('viraliza_link', identity.linkCode);
  return url.toString();
}

/** The public Viraliza short link a user actually shares (redirects to destination). */
export function buildShortUrl(appUrl: string, code: string): string {
  const base = appUrl.replace(/\/$/, '');
  return `${base}/r/${code}`;
}

/** Build a wa.me deep link that opens WhatsApp prefilled with text. */
export function buildWhatsAppShareUrl(text: string, phone?: string): string {
  const target = phone ? phone.replace(/[^\d]/g, '') : '';
  const params = new URLSearchParams({ text });
  return `https://wa.me/${target}?${params.toString()}`;
}

export interface ShareCopyInput {
  product: Pick<Product, 'title' | 'priceCents' | 'marketplace' | 'rating' | 'salesCount'>;
  shortUrl: string;
  priceLabel: string;
  discountPercent?: number;
  commissionLabel?: string;
  storeName?: string;
}

/**
 * Generate ready-to-share WhatsApp copy in pt-BR. Uses scarcity + social proof
 * (the signals that actually move Brazilian social-commerce) and always ends
 * with the link.
 */
export function buildShareText(input: ShareCopyInput): string {
  const { product, shortUrl } = input;
  const lines: string[] = [];
  const store = input.storeName ?? storeLabel(product.marketplace);

  lines.push(`🔥 ${product.title}`);
  if (input.discountPercent && input.discountPercent >= 10) {
    lines.push(`🏷️ ${input.discountPercent}% de desconto — agora por ${input.priceLabel}`);
  } else {
    lines.push(`💰 Só ${input.priceLabel}`);
  }
  const proof: string[] = [];
  if (product.rating >= 4.5) proof.push(`⭐ ${product.rating.toFixed(1)}`);
  if (product.salesCount >= 100) proof.push(`✅ ${compact(product.salesCount)} vendidos`);
  if (proof.length) lines.push(proof.join('  •  '));
  lines.push(`🛒 Compre na ${store}: ${shortUrl}`);
  lines.push('⏰ Promoção por tempo limitado, corre que acaba!');
  return lines.join('\n');
}

export function storeLabel(marketplace: MarketplaceId): string {
  switch (marketplace) {
    case 'mercadolivre':
      return 'Mercado Livre';
    case 'shopee':
      return 'Shopee';
    case 'amazon':
      return 'Amazon';
  }
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} mi`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.', ',')} mil`;
  return String(n);
}

/** Fully assemble a shareable AffiliateLink record. */
export function createAffiliateLink(params: {
  id: string;
  code: string;
  userId: string;
  product: Product;
  appUrl: string;
  affiliateTag: string;
  priceLabel: string;
  campaign?: string;
  providerShortUrl?: string;
}): AffiliateLink {
  const { product, userId, code, appUrl } = params;
  const destinationUrl = buildDestinationUrl(product, {
    affiliateTag: params.affiliateTag,
    userId,
    linkCode: code,
    campaign: params.campaign,
  });
  const shortUrl = buildShortUrl(appUrl, code);
  const discountPercent =
    product.originalPriceCents && product.originalPriceCents > product.priceCents
      ? Math.round(((product.originalPriceCents - product.priceCents) / product.originalPriceCents) * 100)
      : 0;
  const shareText = buildShareText({
    product,
    shortUrl,
    priceLabel: params.priceLabel,
    discountPercent,
  });

  return {
    id: params.id,
    code,
    userId,
    productId: product.id,
    marketplace: product.marketplace,
    title: product.title,
    imageUrl: product.imageUrl,
    destinationUrl,
    whatsappShareUrl: buildWhatsAppShareUrl(shareText),
    providerShortUrl: params.providerShortUrl,
    clicks: 0,
    conversions: 0,
    earningsCents: 0,
    createdAt: new Date().toISOString(),
  };
}

/** Other share targets (all "share everywhere" outlets). */
export function buildSocialShareUrls(text: string, shortUrl: string) {
  const t = encodeURIComponent(`${text}\n${shortUrl}`);
  const u = encodeURIComponent(shortUrl);
  return {
    whatsapp: `https://wa.me/?text=${t}`,
    telegram: `https://t.me/share/url?url=${u}&text=${encodeURIComponent(text)}`,
    twitter: `https://twitter.com/intent/tweet?text=${t}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${u}&description=${encodeURIComponent(text)}`,
    email: `mailto:?subject=${encodeURIComponent('Oferta imperdível')}&body=${t}`,
  };
}
