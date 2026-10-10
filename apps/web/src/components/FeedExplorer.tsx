'use client';

import { useCallback, useEffect, useState } from 'react';
import type { MarketplaceId, RankedProduct } from '@viraliza/core';
import { ProductCard, ProductCardSkeleton } from './ProductCard';

const MARKETPLACES: { id: MarketplaceId | 'all'; label: string }[] = [
  { id: 'all', label: 'Todas as lojas' },
  { id: 'mercadolivre', label: 'Mercado Livre' },
  { id: 'shopee', label: 'Shopee' },
  { id: 'amazon', label: 'Amazon' },
];

const SORTS = [
  { id: 'viral', label: '🔥 Mais virais' },
  { id: 'sales', label: '📈 Mais vendidos' },
  { id: 'commission', label: '💰 Maior comissão' },
  { id: 'discount', label: '🏷️ Maior desconto' },
  { id: 'price_asc', label: 'Menor preço' },
  { id: 'price_desc', label: 'Maior preço' },
];

const CATEGORIES = [
  'all',
  'Eletrônicos',
  'Casa e Cozinha',
  'Beleza',
  'Celulares',
  'Esportes',
  'Calçados',
  'Vestuário',
  'Informática',
  'Livros',
  'Brinquedos',
  'Viagem',
  'Automotivo',
];

export function FeedExplorer({ authenticated }: { authenticated: boolean }) {
  const [marketplace, setMarketplace] = useState<MarketplaceId | 'all'>('all');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('viral');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<RankedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const load = useCallback(
    async (append = false, nextCursor: string | null = null) => {
      setLoading(true);
      const params = new URLSearchParams({
        marketplace,
        category,
        sort,
        limit: '24',
      });
      if (query) params.set('q', query);
      if (append && nextCursor) params.set('cursor', nextCursor);

      try {
        const res = await fetch(`/api/feed?${params.toString()}`);
        const data = (await res.json()) as { items: RankedProduct[]; nextCursor: string | null; total: number };
        setProducts((prev) => (append ? [...prev, ...data.items] : data.items));
        setCursor(data.nextCursor);
        setTotal(data.total);
      } finally {
        setLoading(false);
      }
    },
    [marketplace, category, sort, query],
  );

  useEffect(() => {
    load(false, null);
  }, [load]);

  return (
    <div className="stack gap-16">
      <form
        className="toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(q);
        }}
      >
        <input
          className="input search"
          placeholder="Buscar produto (ex.: airfryer, fone, whey…)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c === 'all' ? 'Todas as categorias' : c}</option>
          ))}
        </select>
        <button className="btn btn-primary" type="submit">Buscar</button>
      </form>

      <div className="toolbar">
        {MARKETPLACES.map((m) => (
          <button
            key={m.id}
            className={`chip ${marketplace === m.id ? 'active' : ''}`}
            onClick={() => setMarketplace(m.id)}
            type="button"
          >
            {m.label}
          </button>
        ))}
      </div>

      <p className="small muted" style={{ margin: 0 }}>
        {total} produtos encontrados
      </p>

      {loading && products.length === 0 ? (
        <div className="grid grid-products">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="notice notice-warn">Nenhum produto encontrado. Tente outra busca ou categoria.</div>
      ) : (
        <div className="grid grid-products">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} authenticated={authenticated} />
          ))}
        </div>
      )}

      {cursor ? (
        <div className="center mt-16">
          <button className="btn" onClick={() => load(true, cursor)} disabled={loading}>
            {loading ? <span className="spinner" /> : null} Carregar mais
          </button>
        </div>
      ) : null}
    </div>
  );
}
