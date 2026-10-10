/**
 * Demo catalog — realistic Brazilian "viral product" data used in mock mode.
 *
 * Numbers are plausible (not real) so the feed, ranking, AI agent and UI all
 * behave like production. Once real API keys are configured, live adapters
 * replace this data automatically; nothing else in the app changes.
 *
 * Every product's `url` points at the real marketplace domain so affiliate
 * link construction (and manual testing) behaves realistically.
 */

import type { MarketplaceId, Product } from '@viraliza/core';

interface Seed {
  m: MarketplaceId;
  id: string;
  title: string;
  desc: string;
  cat: string;
  price: number; // reais
  was?: number;
  rating: number;
  reviews: number;
  sales: number;
  trending?: boolean;
  commission?: number;
  tags: string[];
}

const SEEDS: Seed[] = [
  // ── Mercado Livre ─────────────────────────────────────────────────────────
  { m: 'mercadolivre', id: 'MLB2451001001', title: 'Fone de Ouvido Bluetooth TWS Pro com Cancelamento de Ruído', desc: 'Fone sem fio com case carregador, até 30h de bateria, à prova d\'água IPX5.', cat: 'Eletrônicos', price: 89.9, was: 199.9, rating: 4.8, reviews: 12540, sales: 38200, trending: true, commission: 8, tags: ['fone', 'bluetooth', 'audio', 'presente'] },
  { m: 'mercadolivre', id: 'MLB2451001002', title: 'Smartwatch D20 Ultra Relógio Inteligente Monitor Cardíaco', desc: 'Relógio inteligente com monitor de batimentos, passos e notificações.', cat: 'Eletrônicos', price: 49.9, was: 149.9, rating: 4.6, reviews: 8321, sales: 27500, trending: true, commission: 8, tags: ['smartwatch', 'relogio', 'fitness'] },
  { m: 'mercadolivre', id: 'MLB2451001003', title: 'Air Fryer Fritadeira Elétrica Sem Óleo 5L 1500W', desc: 'Fritadeira elétrica 5 litros, 8 programas, antiaderente.', cat: 'Casa e Cozinha', price: 289.9, was: 499.9, rating: 4.7, reviews: 4120, sales: 9800, commission: 6, tags: ['airfryer', 'cozinha', 'casa'] },
  { m: 'mercadolivre', id: 'MLB2451001004', title: 'Kit 4 Câmeras de Segurança Wi-Fi Full HD Visão Noturna', desc: 'Kit com 4 câmeras Wi-Fi 1080p, visão noturna e app no celular.', cat: 'Casa e Cozinha', price: 399.9, was: 799.9, rating: 4.5, reviews: 2310, sales: 5400, commission: 7, tags: ['camera', 'seguranca', 'wifi'] },
  { m: 'mercadolivre', id: 'MLB2451001005', title: 'Tênis Esportivo Masculino Corrida Leve Respirável', desc: 'Tênis leve, solado antiderrapante e palmilha em gel.', cat: 'Calçados', price: 119.9, was: 249.9, rating: 4.6, reviews: 6890, sales: 21000, trending: true, tags: ['tenis', 'corrida', 'moda'] },
  { m: 'mercadolivre', id: 'MLB2451001006', title: 'Organizador de Malas Kit 8 Peças Viagem a Vácuo', desc: 'Kit organizador de bagagem com sacos a vácuo e necessaire.', cat: 'Viagem', price: 59.9, was: 129.9, rating: 4.7, reviews: 3210, sales: 14200, tags: ['viagem', 'organizador', 'mala'] },
  { m: 'mercadolivre', id: 'MLB2451001007', title: 'Caixa de Som Bluetooth Portátil À Prova d\'Água 20W', desc: 'Caixa de som portátil com graves potentes, 12h de bateria.', cat: 'Eletrônicos', price: 149.9, was: 299.9, rating: 4.7, reviews: 5120, sales: 17300, commission: 8, tags: ['caixa de som', 'bluetooth', 'festa'] },
  { m: 'mercadolivre', id: 'MLB2451001008', title: 'Aspirador de Pó Portátil 3 em 1 Sem Fio 12000Pa', desc: 'Aspirador portátil potente para casa e carro, sem fio.', cat: 'Casa e Cozinha', price: 159.9, was: 329.9, rating: 4.6, reviews: 2980, sales: 8700, tags: ['aspirador', 'limpeza', 'casa'] },
  { m: 'mercadolivre', id: 'MLB2451001009', title: 'Suporte de Celular para Carro Magnético Universal', desc: 'Suporte magnético 360° para painel, compatível com todos os celulares.', cat: 'Automotivo', price: 29.9, was: 79.9, rating: 4.8, reviews: 11200, sales: 41000, commission: 9, tags: ['carro', 'suporte', 'celular'] },
  { m: 'mercadolivre', id: 'MLB2451001010', title: 'Lâmpada LED Inteligente Wi-Fi RGB Compatível Alexa', desc: 'Lâmpada RGB que muda de cor por app e por voz.', cat: 'Casa e Cozinha', price: 39.9, was: 89.9, rating: 4.6, reviews: 4320, sales: 15600, tags: ['led', 'smart home', 'alexa'] },
  // ── Shopee ────────────────────────────────────────────────────────────────
  { m: 'shopee', id: 'SPE10000001', title: 'Kit 10 Meias Esportivas Unissex Algodão Antiderrapante', desc: 'Meias esportivas confortáveis, pacote com 10 pares.', cat: 'Vestuário', price: 34.9, was: 89.9, rating: 4.7, reviews: 28900, sales: 96000, trending: true, commission: 16, tags: ['meias', 'esporte', 'combo'] },
  { m: 'shopee', id: 'SPE10000002', title: 'Organizador de Maquiagem Acrílico Giratório 360°', desc: 'Organizador giratório para maquiagem e pincéis.', cat: 'Beleza', price: 39.9, was: 99.9, rating: 4.8, reviews: 15600, sales: 52000, trending: true, commission: 15, tags: ['organizador', 'maquiagem', 'beleza'] },
  { m: 'shopee', id: 'SPE10000003', title: 'Escova Secadora Alisadora 4 em 1 Modeladora Profissional', desc: 'Escova secadora e alisadora 4 em 1, íons negativos.', cat: 'Beleza', price: 89.9, was: 229.9, rating: 4.7, reviews: 9800, sales: 31000, commission: 14, tags: ['escova', 'cabelo', 'beleza'] },
  { m: 'shopee', id: 'SPE10000004', title: 'Película de Vidro Temperado 3D para iPhone 3 Unidades', desc: 'Kit com 3 películas de vidro 3D full cover.', cat: 'Celulares', price: 19.9, was: 59.9, rating: 4.6, reviews: 22100, sales: 78000, commission: 18, tags: ['pelicula', 'iphone', 'combo'] },
  { m: 'shopee', id: 'SPE10000005', title: 'Garrafa Térmica Inox 1,5L Stanley Style Mantém Gelado 24h', desc: 'Garrafa térmica inox 1,5 litros, mantém gelado por 24h.', cat: 'Casa e Cozinha', price: 74.9, was: 159.9, rating: 4.8, reviews: 12400, sales: 39000, trending: true, commission: 13, tags: ['garrafa', 'termica', 'trend'] },
  { m: 'shopee', id: 'SPE10000006', title: 'Luminária de Mesa LED Dobrável Recarregável USB Toque', desc: 'Luminária LED recarregável com 3 tons de luz e toque.', cat: 'Casa e Cozinha', price: 45.9, was: 119.9, rating: 4.7, reviews: 7600, sales: 24000, commission: 15, tags: ['luminaria', 'led', 'estudo'] },
  { m: 'shopee', id: 'SPE10000007', title: 'Capa de Célula Impermeável Universal Flutuante', desc: 'Capa à prova d\'água para celular, ideal para praia e piscina.', cat: 'Celulares', price: 24.9, was: 69.9, rating: 4.6, reviews: 18900, sales: 64000, commission: 17, tags: ['capa', 'praia', 'verao'] },
  { m: 'shopee', id: 'SPE10000008', title: 'Máscara Facial de Hidrogel Kit 30 Unidades Vitamina C', desc: 'Kit com 30 máscaras faciais de hidrogel com vitamina C.', cat: 'Beleza', price: 49.9, was: 129.9, rating: 4.8, reviews: 13400, sales: 47000, commission: 16, tags: ['mascara', 'skincare', 'combo'] },
  { m: 'shopee', id: 'SPE10000009', title: 'Fone Gamer com Microfone LED RGB Headset Estéreo', desc: 'Headset gamer com microfone ajustável e LED RGB.', cat: 'Eletrônicos', price: 69.9, was: 179.9, rating: 4.7, reviews: 8700, sales: 29000, commission: 14, tags: ['headset', 'gamer', 'rgb'] },
  { m: 'shopee', id: 'SPE10000010', title: 'Conjunto de Panelas Antiaderente 8 Peças Cerâmica', desc: 'Jogo de panelas antiaderente com revestimento cerâmico.', cat: 'Casa e Cozinha', price: 199.9, was: 459.9, rating: 4.6, reviews: 5400, sales: 16000, commission: 12, tags: ['panelas', 'cozinha', 'combo'] },
  // ── Amazon ────────────────────────────────────────────────────────────────
  { m: 'amazon', id: 'AAE-B0ABCD1', title: 'Echo Dot 5ª Geração Smart Speaker com Alexa', desc: 'Assistente inteligente Alexa, som mais potente, controle smart home.', cat: 'Eletrônicos', price: 349.0, was: 499.0, rating: 4.8, reviews: 45600, sales: 88000, trending: true, commission: 5, tags: ['alexa', 'smart home', 'echo'] },
  { m: 'amazon', id: 'AAE-B0ABCD2', title: 'Kindle 11ª Geração 16GB com Luz Embutida', desc: 'Leitor digital com tela antirreflexo e bateria de semanas.', cat: 'Eletrônicos', price: 429.0, was: 549.0, rating: 4.9, reviews: 22300, sales: 34000, commission: 4, tags: ['kindle', 'leitura', 'presente'] },
  { m: 'amazon', id: 'AAE-B0ABCD3', title: 'Fire TV Stick 4K com Controle por Voz Alexa', desc: 'Streaming em 4K com Alexa, Wi-Fi 6.', cat: 'Eletrônicos', price: 299.0, was: 449.0, rating: 4.8, reviews: 31000, sales: 61000, trending: true, commission: 5, tags: ['fire tv', 'streaming', 'alexa'] },
  { m: 'amazon', id: 'AAE-B0ABCD4', title: 'Whey Protein Concentrado 900g Sabor Baunilha', desc: 'Proteína concentrada para ganho de massa muscular.', cat: 'Esportes', price: 129.9, was: 199.9, rating: 4.7, reviews: 8900, sales: 22000, commission: 6, tags: ['whey', 'suplemento', 'fitness'] },
  { m: 'amazon', id: 'AAE-B0ABCD5', title: 'Cafeteira Expresso Automática 15 Bar Compacta', desc: 'Cafeteira expresso automática com vaporizador de leite.', cat: 'Casa e Cozinha', price: 599.0, was: 899.0, rating: 4.6, reviews: 3400, sales: 7600, commission: 4, tags: ['cafeteira', 'cafe', 'cozinha'] },
  { m: 'amazon', id: 'AAE-B0ABCD6', title: 'Livro Best-seller Hábitos Atômicos Capa Comum', desc: 'O método comprovado para criar bons hábitos e quebrar os ruins.', cat: 'Livros', price: 39.9, was: 64.9, rating: 4.9, reviews: 52100, sales: 120000, trending: true, commission: 6, tags: ['livro', 'desenvolvimento pessoal', 'presente'] },
  { m: 'amazon', id: 'AAE-B0ABCD7', title: 'Conjunto LEGO Criador 3 em 1 31147 Animais Selvagens', desc: 'Blocos de montar criador com 3 modelos diferentes.', cat: 'Brinquedos', price: 149.9, was: 229.9, rating: 4.8, reviews: 2100, sales: 6800, commission: 5, tags: ['lego', 'brinquedo', 'presente'] },
  { m: 'amazon', id: 'AAE-B0ABCD8', title: 'Mouse Sem Fio Recarregável Silencioso 2.4G', desc: 'Mouse silencioso recarregável com 3 níveis de DPI.', cat: 'Informática', price: 69.9, was: 129.9, rating: 4.7, reviews: 12700, sales: 38000, commission: 6, tags: ['mouse', 'escritorio', 'informatica'] },
  { m: 'amazon', id: 'AAE-B0ABCD9', title: 'Robô Aspirador Inteligente Wi-Fi 3 em 1 2000Pa', desc: 'Aspira, varre e passa pano, controle por app e Alexa.', cat: 'Casa e Cozinha', price: 899.0, was: 1499.0, rating: 4.6, reviews: 4200, sales: 9200, commission: 4, tags: ['robo', 'aspirador', 'smart home'] },
  { m: 'amazon', id: 'AAE-B0ABCDA', title: 'Microfone Condensador USB Profissional com Tripé', desc: 'Microfone USB para streaming, podcast e home office.', cat: 'Informática', price: 189.0, was: 349.0, rating: 4.7, reviews: 5600, sales: 14000, commission: 6, tags: ['microfone', 'streaming', 'podcast'] },
];

const DOMAINS: Record<MarketplaceId, (id: string) => string> = {
  mercadolivre: (id) => `https://produto.mercadolivre.com.br/${id.replace(/^MLB/, 'MLB-')}`,
  shopee: (id) => `https://shopee.com.br/product/${id.slice(3)}/1`,
  amazon: (id) => `https://www.amazon.com.br/dp/${id.replace(/^AAE-/, '')}`,
};

const now = new Date().toISOString();

export const DEMO_CATALOG: Product[] = SEEDS.map((s) => ({
  id: `${s.m}:${s.id}`,
  marketplace: s.m,
  externalId: s.id,
  title: s.title,
  description: s.desc,
  imageUrl: `https://picsum.photos/seed/${encodeURIComponent(s.id)}/600/600`,
  images: [1, 2, 3].map((n) => `https://picsum.photos/seed/${encodeURIComponent(s.id)}-${n}/600/600`),
  category: s.cat,
  priceCents: Math.round(s.price * 100),
  originalPriceCents: s.was ? Math.round(s.was * 100) : undefined,
  currency: 'BRL',
  rating: s.rating,
  reviewsCount: s.reviews,
  salesCount: s.sales,
  url: DOMAINS[s.m](s.id),
  trending: s.trending,
  commissionPercent: s.commission,
  tags: s.tags,
  syncedAt: now,
}));

export const DEMO_CATEGORIES: string[] = [...new Set(SEEDS.map((s) => s.cat))].sort();
