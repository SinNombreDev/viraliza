import { describe, expect, it } from 'vitest';
import { rankProducts, type Product } from '@viraliza/core';
import { SalesAgent, extractQuery } from '../src/agent';
import { MockAiProvider } from '../src/mock-provider';

const catalog: Product[] = [
  {
    id: 'shopee:1',
    marketplace: 'shopee',
    externalId: '1',
    title: 'Fone de Ouvido Bluetooth TWS Pro',
    description: 'fone',
    imageUrl: '',
    category: 'Eletrônicos',
    priceCents: 8990,
    originalPriceCents: 19990,
    currency: 'BRL',
    rating: 4.8,
    reviewsCount: 12500,
    salesCount: 38000,
    url: 'https://shopee.com.br/product/1/1',
    trending: true,
    syncedAt: new Date().toISOString(),
  },
  {
    id: 'amazon:2',
    marketplace: 'amazon',
    externalId: '2',
    title: 'Livro Hábitos Atômicos',
    description: 'livro',
    imageUrl: '',
    category: 'Livros',
    priceCents: 3990,
    currency: 'BRL',
    rating: 4.9,
    reviewsCount: 52000,
    salesCount: 120000,
    url: 'https://www.amazon.com.br/dp/2',
    syncedAt: new Date().toISOString(),
  },
];

function makeAgent(overrides: Partial<ConstructorParameters<typeof SalesAgent>[0]> = {}) {
  return new SalesAgent({
    provider: new MockAiProvider(),
    searchProducts: async () => rankProducts(catalog, 'pro'),
    createLink: async (productId) => ({
      code: 'Ab12Cd',
      shortUrl: `https://viraliza.app/r/Ab12Cd`,
      shareText: `🔥 ${catalog[0]!.title}\nhttps://viraliza.app/r/Ab12Cd`,
      whatsappShareUrl: 'https://wa.me/?text=x',
      productId,
    }),
    ...overrides,
  });
}

describe('extractQuery', () => {
  it('strips filler verbs from natural language', () => {
    expect(extractQuery('quero os mais virais de fone bluetooth')).toContain('fone bluetooth');
  });
});

describe('SalesAgent', () => {
  it('recommends real products and cites the data', async () => {
    const agent = makeAgent();
    const reply = await agent.reply('o que eu vendo hoje?', { plan: 'pro' });
    expect(reply.message.content).toContain('Fone de Ouvido Bluetooth TWS Pro');
    expect(reply.message.productIds?.length).toBeGreaterThan(0);
  });

  it('creates a link when the user asks for one', async () => {
    const agent = makeAgent();
    const reply = await agent.reply('gera o link do primeiro produto', { plan: 'pro' });
    expect(reply.createdLink).toBeDefined();
    expect(reply.message.content).toContain('/r/Ab12Cd');
    expect(reply.message.shareText).toContain('🔥');
  });

  it('explains commission math using a real product price', async () => {
    const agent = makeAgent();
    const reply = await agent.reply('quanto eu ganho por venda?', { plan: 'pro' });
    // shopee 14% of R$89,90 = R$12,59 gross; pro fee 15% → net R$10,70
    expect(reply.message.content).toMatch(/Você recebe/);
    expect(reply.message.content).toMatch(/por venda/);
  });

  it('never fails the user when the LLM throws', async () => {
    const agent = makeAgent({
      provider: { name: 'boom', complete: async () => { throw new Error('down'); } },
    });
    const reply = await agent.reply('me mostra produtos');
    expect(reply.message.content.length).toBeGreaterThan(20);
  });

  it('does not create links when unsigned-in (no createLink dep)', async () => {
    const agent = makeAgent({ createLink: undefined });
    const reply = await agent.reply('gera o link de um produto');
    expect(reply.createdLink).toBeUndefined();
  });
});
