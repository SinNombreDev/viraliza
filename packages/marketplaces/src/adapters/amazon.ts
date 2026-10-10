/**
 * Amazon adapter (live) — PA-API v5 with AWS SigV4 signing.
 *
 * Targets the Brazil marketplace (webservices.amazon.com.br, region us-east-1,
 * service "ProductAdvertisingAPI"). SearchItems / GetItems / GetBrowseNodes.
 *
 * Reference: Amazon Product Advertising API v5. Verify your Partner tag and
 * that your Associates account is approved for the API before enabling live
 * mode (the API only works after your first 3 qualifying sales).
 */

import { createHash, createHmac } from 'node:crypto';
import type { Paged, Product } from '@viraliza/core';
import type {
  AffiliateIdentityLike,
  AffiliateLinkResult,
  MarketplaceAdapter,
  MarketplaceConfig,
  SearchOptions,
  TrendingOptions,
} from '../adapter';

const HOST = 'webservices.amazon.com.br';
const REGION = 'us-east-1';
const SERVICE = 'ProductAdvertisingAPI';
const MARKETPLACE = 'www.amazon.com.br';

interface AmazonItem {
  ASIN: string;
  ItemInfo?: {
    Title?: { DisplayValue?: string };
    Features?: { DisplayValues?: string[] };
    ByLineInfo?: { DisplayValue?: string };
  };
  Images?: { Primary?: { Large?: { URL?: string } } };
  ItemInfo2?: unknown;
  Offers?: { Listings?: Array<{ Price?: { Amount?: number; Currency?: string } }> };
  CustomerReviews?: { StarRating?: { Value?: number }; Count?: number };
}

export class AmazonAdapter implements MarketplaceAdapter {
  readonly id = 'amazon' as const;
  readonly live = true;

  constructor(private readonly config: MarketplaceConfig) {}

  async search(query: string, options: SearchOptions = {}): Promise<Paged<Product>> {
    const body = {
      Keywords: query,
      SearchIndex: 'All',
      ItemCount: options.limit ?? 10,
      ItemPage: Math.floor((options.offset ?? 0) / (options.limit ?? 10)) + 1,
      PartnerTag: this.config.amazon.partnerTag,
      PartnerType: 'Associates',
      Marketplace: MARKETPLACE,
      Resources: AMAZON_RESOURCES,
    };
    const json = await this.call('/paapi5/searchitems', body);
    const items = ((json.SearchResult?.Items ?? []) as AmazonItem[]).map((i) => this.mapItem(i));
    const total = json.SearchResult?.TotalResultCount ?? items.length;
    const page = body.ItemPage;
    const next = page * body.ItemCount < total ? String(page * body.ItemCount) : null;
    return { items, total, nextCursor: next };
  }

  async getProduct(externalId: string): Promise<Product | null> {
    const body = {
      ItemIds: [externalId],
      PartnerTag: this.config.amazon.partnerTag,
      PartnerType: 'Associates',
      Marketplace: MARKETPLACE,
      Resources: AMAZON_RESOURCES,
    };
    const json = await this.call('/paapi5/getitems', body);
    const item = (json.ItemsResult?.Items ?? [])[0] as AmazonItem | undefined;
    return item ? this.mapItem(item) : null;
  }

  async trending(options: TrendingOptions = {}): Promise<Product[]> {
    // PA-API has no "trending" call; use best-seller browse node search.
    const body = {
      BrowseNodeId: '16243890011', // Best Sellers (Eletrônicos) — adjust per category
      ItemCount: options.limit ?? 10,
      PartnerTag: this.config.amazon.partnerTag,
      PartnerType: 'Associates',
      Marketplace: MARKETPLACE,
      Resources: AMAZON_RESOURCES,
    };
    const json = await this.call('/paapi5/getbestsellers', body);
    return ((json.BestSellers?.Items ?? []) as AmazonItem[]).map((i) => this.mapItem(i));
  }

  async mintAffiliateLink(product: Product, identity: AffiliateIdentityLike): Promise<AffiliateLinkResult> {
    // Amazon has no link-minting API: the tracked link is the product URL with
    // the Partner tag + our sub-tag appended (done by core's link builder).
    const url = new URL(product.url);
    url.searchParams.set('tag', this.config.amazon.partnerTag ?? identity.affiliateTag);
    url.searchParams.set('ascsubtag', `${identity.userId}-${identity.linkCode}`);
    return { destinationUrl: url.toString() };
  }

  private async call(path: string, payload: Record<string, unknown>) {
    const body = JSON.stringify(payload);
    const headers = this.sign(path, body);
    const res = await fetch(`https://${HOST}${path}`, { method: 'POST', headers, body });
    if (!res.ok) throw new Error(`Amazon PA-API failed: ${res.status} ${await res.text()}`);
    return (await res.json()) as AmazonResponse;
  }

  private mapItem(i: AmazonItem): Product {
    const priceObj = i.Offers?.Listings?.[0]?.Price;
    return {
      id: `amazon:${i.ASIN}`,
      marketplace: 'amazon',
      externalId: i.ASIN,
      title: i.ItemInfo?.Title?.DisplayValue ?? i.ASIN,
      description: (i.ItemInfo?.Features?.DisplayValues ?? []).join(' • ') || i.ItemInfo?.Title?.DisplayValue || '',
      imageUrl: i.Images?.Primary?.Large?.URL ?? '',
      category: i.ItemInfo?.ByLineInfo?.DisplayValue ?? 'Geral',
      priceCents: Math.round((priceObj?.Amount ?? 0) * 100),
      currency: 'BRL',
      rating: i.CustomerReviews?.StarRating?.Value ?? 0,
      reviewsCount: i.CustomerReviews?.Count ?? 0,
      salesCount: 0,
      url: `https://${MARKETPLACE}/dp/${i.ASIN}`,
      trending: false,
      tags: [],
      syncedAt: new Date().toISOString(),
    };
  }

  /** AWS Signature V4 for PA-API. */
  private sign(path: string, body: string): Record<string, string> {
    const { accessKey = '', secretKey = '' } = this.config.amazon;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    const canonicalHeaders =
      `content-encoding:amz-1.0\n` +
      `content-type:application/json; charset=utf-8\n` +
      `host:${HOST}\n` +
      `x-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-encoding;content-type;host;x-amz-date';
    const payloadHash = createHash('sha256').update(body).digest('hex');
    const canonicalRequest = ['POST', path, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');

    const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const hmac = (key: Buffer | string, data: string) => createHmac('sha256', key).update(data).digest();
    const kDate = hmac(`AWS4${secretKey}`, dateStamp);
    const kRegion = hmac(kDate, REGION);
    const kService = hmac(kRegion, SERVICE);
    const kSigning = hmac(kService, 'aws4_request');
    const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    return {
      'content-encoding': 'amz-1.0',
      'content-type': 'application/json; charset=utf-8',
      'x-amz-date': amzDate,
      authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    };
  }
}

const AMAZON_RESOURCES = [
  'ItemInfo.Title',
  'ItemInfo.Features',
  'ItemInfo.ByLineInfo',
  'Images.Primary.Large',
  'Offers.Listings.Price',
  'CustomerReviews.StarRating',
  'CustomerReviews.Count',
];

interface AmazonResponse {
  SearchResult?: { Items?: AmazonItem[]; TotalResultCount?: number };
  ItemsResult?: { Items?: AmazonItem[] };
  BestSellers?: { Items?: AmazonItem[] };
}
