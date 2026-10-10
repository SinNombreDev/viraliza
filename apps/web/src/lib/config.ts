/**
 * Server-side configuration, read once from the environment.
 * Everything has safe defaults so the app runs with an empty .env.
 */

function env(key: string, fallback = ''): string {
  const v = process.env[key];
  return v && v.length > 0 ? v : fallback;
}

export const appConfig = {
  appUrl: env('APP_URL', 'http://localhost:3000'),
  appSecret: env('APP_SECRET', 'dev-insecure-secret-change-me'),
  currency: 'BRL',
  databaseUrl: env('DATABASE_URL'),
  pricing: {
    platformFeePercent: Number(env('PLATFORM_FEE_PERCENT', '20')),
    defaultCommissionPercent: Number(env('DEFAULT_COMMISSION_PERCENT', '8')),
    referralPercent: Number(env('REFERRAL_PERCENT', '5')),
  },
  ai: {
    provider: env('AI_PROVIDER', 'mock') as 'mock' | 'openai' | 'azure-openai',
    model: env('AI_MODEL', 'gpt-4o-mini'),
    openaiApiKey: env('OPENAI_API_KEY'),
    azure: {
      endpoint: env('AZURE_OPENAI_ENDPOINT'),
      apiKey: env('AZURE_OPENAI_API_KEY'),
      deployment: env('AZURE_OPENAI_DEPLOYMENT'),
    },
  },
  whatsapp: {
    provider: env('WHATSAPP_PROVIDER', 'mock') as 'mock' | 'cloud',
    phoneNumberId: env('WHATSAPP_PHONE_NUMBER_ID'),
    accessToken: env('WHATSAPP_ACCESS_TOKEN'),
    verifyToken: env('WHATSAPP_VERIFY_TOKEN', 'change-me-verify-token'),
    businessAccountId: env('WHATSAPP_BUSINESS_ACCOUNT_ID'),
  },
  marketplaceMode: env('MARKETPLACE_MODE', 'mock') as 'mock' | 'live',
  /** Viraliza's own affiliate accounts per marketplace. Users are tracked via sub-IDs. */
  affiliateTags: {
    mercadolivre: env('ML_AFFILIATE_ID', env('FALLBACK_AFFILIATE_TAG', 'viraliza')),
    shopee: env('SHOPEE_AFFILIATE_ID', env('FALLBACK_AFFILIATE_TAG', 'viraliza')),
    amazon: env('AMAZON_PARTNER_TAG', env('FALLBACK_AFFILIATE_TAG', 'viraliza-20')),
  },
  /** Fallback affiliate tag used when a user has none configured. */
  fallbackAffiliateTag: env('FALLBACK_AFFILIATE_TAG', 'viraliza'),
  subscription: {
    proMonthlyCents: Math.round(Number(env('PRICE_PRO_MONTHLY', '29.90')) * 100),
    proOneTimeCents: Math.round(Number(env('PRICE_PRO_ONE_TIME', '199.00')) * 100),
    businessMonthlyCents: Math.round(Number(env('PRICE_BUSINESS_MONTHLY', '99.90')) * 100),
  },
  stripe: {
    secretKey: env('STRIPE_SECRET_KEY'),
    webhookSecret: env('STRIPE_WEBHOOK_SECRET'),
  },
  pixKey: env('PIX_KEY'),
};

export const isMockMode = {
  ai: appConfig.ai.provider === 'mock',
  whatsapp: appConfig.whatsapp.provider === 'mock',
  marketplaces: appConfig.marketplaceMode === 'mock',
};
