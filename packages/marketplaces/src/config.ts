import type { MarketplaceConfig } from './adapter';

function env(key: string): string | undefined {
  const v = process.env[key];
  return v && v.length > 0 ? v : undefined;
}

/** Build the marketplace config from environment variables. */
export function loadMarketplaceConfig(): MarketplaceConfig {
  const mode = (env('MARKETPLACE_MODE') ?? 'mock') === 'live' ? 'live' : 'mock';
  return {
    mode,
    mercadoLivre: {
      appId: env('ML_APP_ID'),
      clientSecret: env('ML_CLIENT_SECRET'),
      affiliateId: env('ML_AFFILIATE_ID'),
      accessToken: env('ML_ACCESS_TOKEN'),
    },
    shopee: {
      appId: env('SHOPEE_APP_ID'),
      appSecret: env('SHOPEE_APP_SECRET'),
      affiliateId: env('SHOPEE_AFFILIATE_ID'),
    },
    amazon: {
      accessKey: env('AMAZON_ACCESS_KEY'),
      secretKey: env('AMAZON_SECRET_KEY'),
      partnerTag: env('AMAZON_PARTNER_TAG'),
      region: env('AMAZON_REGION') ?? 'com.br',
    },
  };
}
