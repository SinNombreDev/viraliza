/**
 * Shopee Affiliate adapter (live).
 *
 * Talks to the Shopee Affiliate Open API (GraphQL gateway). Requests are signed
 * with SHA-256(appId + timestamp + payload + appSecret). Product search uses
 * `productOfferV2`; tracked short links use `generateShortLink`.
 *
 * Reference: Shopee Affiliate Open API docs. Verify scopes for your account.
 */

import { createHash } from 'node:crypto';
import type { Paged, Product } from '@viraliza/core';
import type {
  AffiliateIdentityLike,
  AffiliateLinkResult,
  MarketplaceAdapter,
  MarketplaceConfig,
  SearchOptions,
  TrendingOptions,
} from '../adapter';

const GATEWAY = 'https://open-api.affiliate.shopee.com.br/graphql';

interface ShopeeNode {
  itemId: number | string;
  productName: string;
  price: string;
  priceMin?: string;
  priceMax?: string;
  imageUrl: string;
  productLink: string;
  shopName?: string;
  productCatIds?: number[];
  ratingStar?: string;
  sales?: number;
  commissionRate?: string;
  priceDiscountRate?: number;
}

interface ShopeeGraphQLResponse {
  data?: {
    productOfferV2?: {
      nodes?: ShopeeNode[];
      pageInfo?: { hasNextPage: boolean };
    };
    generateShortLink?: { shortLink?: string };
  };
  errors?: Array<{ message: string }>;
}

export class ShopeeAdapter implements MarketplaceAdapter {
  readonly id = 'shopee' as const;
  readonly live = true;

  constructor(private readonly config: MarketplaceConfig) {}

  async search(query: string, options: SearchOptions = {}): Promise<Paged<Product>> {
    const gql = `query Search($keyword: String, $page: Int, $limit: Int) {
      productOfferV2(keyword: $keyword, page: $page, limit: $limit, sortType: 2) {
        nodes { itemId productName price priceMin priceMax imageUrl productLink ratingStar sales commissionRate priceDiscountRate }
        pageInfo { hasNextPage }
      }
    }`;
    const payload = JSON.stringify({
      query: gql,
      variables: {
        keyword: query,
        page: Math.floor((options.offset ?? 0) / (options.limit ?? 20)) + 1,
        limit: options.limit ?? 20,
      },
    });
    const json = await this.signedRequest(payload);
    const nodes = json.data?.productOfferV2?.nodes ?? [];
    const items = nodes.map((n) => this.mapNode(n));
    const hasNext = json.data?.productOfferV2?.pageInfo?.hasNextPage ?? false;
    return {
      items,
      total: items.length,
      nextCursor: hasNext ? String((options.offset ?? 0) + (options.limit ?? 20)) : null,
    };
  }

  async getProduct(externalId: string): Promise<Product | null> {
    const gql = `query One($itemId: Int64) {
      productOfferV2(itemId: $itemId, limit: 1) { nodes { itemId productName price imageUrl productLink ratingStar sales commissionRate } }
    }`;
    const payload = JSON.stringify({ query: gql, variables: { itemId: Number(externalId) || externalId } });
    const json = await this.signedRequest(payload);
    const node = json.data?.productOfferV2?.nodes?.[0];
    return node ? this.mapNode(node) : null;
  }

  async trending(options: TrendingOptions = {}): Promise<Product[]> {
    const gql = `query Trending($limit: Int) {
      productOfferV2(sortType: 2, limit: $limit) {
        nodes { itemId productName price imageUrl productLink ratingStar sales commissionRate }
      }
    }`;
    const payload = JSON.stringify({ query: gql, variables: { limit: options.limit ?? 10 } });
    const json = await this.signedRequest(payload);
    return (json.data?.productOfferV2?.nodes ?? []).map((n) => this.mapNode(n));
  }

  async mintAffiliateLink(
    _product: Product,
    identity: AffiliateIdentityLike,
  ): Promise<AffiliateLinkResult> {
    const gql = `mutation Link($originUrl: String!, $subIds: [String!]) {
      generateShortLink(input: { originUrl: $originUrl, subIds: $subIds }) { shortLink }
    }`;
    const payload = JSON.stringify({
      query: gql,
      variables: {
        originUrl: _product.url,
        subIds: [`${identity.userId}-${identity.linkCode}`],
      },
    });
    const json = await this.signedRequest(payload);
    return { shortUrl: json.data?.generateShortLink?.shortLink };
  }

  private async signedRequest(payload: string): Promise<ShopeeGraphQLResponse> {
    const { appId, appSecret } = this.config.shopee;
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash('sha256')
      .update(`${appId}${timestamp}${payload}${appSecret}`)
      .digest('hex');
    const res = await fetch(GATEWAY, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${signature}`,
      },
      body: payload,
    });
    if (!res.ok) throw new Error(`Shopee API failed: ${res.status}`);
    const json = (await res.json()) as ShopeeGraphQLResponse;
    if (json.errors?.length) throw new Error(`Shopee API error: ${json.errors[0]!.message}`);
    return json;
  }

  private mapNode(n: ShopeeNode): Product {
    const price = Number(n.priceMin ?? n.price ?? 0);
    const discount = n.priceDiscountRate ?? 0;
    return {
      id: `shopee:${n.itemId}`,
      marketplace: 'shopee',
      externalId: String(n.itemId),
      title: n.productName,
      description: n.productName,
      imageUrl: n.imageUrl,
      category: (n.productCatIds ?? []).join(',') || 'Geral',
      priceCents: Math.round(price * 100),
      originalPriceCents: discount > 0 ? Math.round((price / (1 - discount)) * 100) : undefined,
      currency: 'BRL',
      rating: Number(n.ratingStar ?? 0),
      reviewsCount: 0,
      salesCount: n.sales ?? 0,
      url: n.productLink,
      trending: false,
      commissionPercent: n.commissionRate ? Number(n.commissionRate) * 100 : undefined,
      tags: [],
      syncedAt: new Date().toISOString(),
    };
  }
}
