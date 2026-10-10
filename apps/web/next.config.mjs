/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@viraliza/core',
    '@viraliza/marketplaces',
    '@viraliza/ai',
    '@viraliza/whatsapp',
    '@viraliza/db',
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'http2.mlstatic.com' },
      { protocol: 'https', hostname: 'cf.shopee.com.br' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
    ],
  },
};

export default nextConfig;
