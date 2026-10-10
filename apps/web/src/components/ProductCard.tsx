'use client';

import { useState } from 'react';
import {
  buildSocialShareUrls,
  centsToBRL,
  formatCompact,
  storeLabel,
  type AffiliateLink,
  type RankedProduct,
} from '@viraliza/core';

const STORE_BADGE: Record<string, string> = {
  mercadolivre: 'badge-ml',
  shopee: 'badge-shopee',
  amazon: 'badge-amz',
};

export function ProductCard({ product, authenticated }: { product: RankedProduct; authenticated: boolean }) {
  const [link, setLink] = useState<AffiliateLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shortUrl = link ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${link.code}` : '';

  async function generate() {
    if (!authenticated) {
      window.location.href = `/entrar?next=/app/explorar`;
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível gerar o link.');
      setLink(data.link);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const shareUrls = link ? buildSocialShareUrls(link.title, shortUrl) : null;

  return (
    <article className="card card-hover product">
      <div className="product-img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl} alt={product.title} loading="lazy" />
        <div className="overlay-badges">
          <span className="badge badge-viral">⚡ viral {product.viralScore}</span>
          {product.discountPercent >= 10 ? <span className="badge badge-hot">-{product.discountPercent}%</span> : null}
        </div>
        <div className="overlay-right">
          <span className={`badge ${STORE_BADGE[product.marketplace] ?? ''}`}>{storeLabel(product.marketplace)}</span>
        </div>
      </div>

      <div className="product-body">
        <h3 className="product-title">{product.title}</h3>

        <div className="price-row">
          <span className="price">{centsToBRL(product.priceCents)}</span>
          {product.originalPriceCents && product.originalPriceCents > product.priceCents ? (
            <span className="price-was">{centsToBRL(product.originalPriceCents)}</span>
          ) : null}
        </div>

        <div className="row gap-8 wrap tiny muted">
          {product.rating ? <span>⭐ {product.rating.toFixed(1)}</span> : null}
          {product.salesCount ? <span>✅ {formatCompact(product.salesCount)} vendidos</span> : null}
        </div>

        <div className="commission">💰 Você ganha ~{centsToBRL(product.estimatedNetCommissionCents)}/venda</div>

        {error ? <div className="tiny" style={{ color: 'var(--red)' }}>{error}</div> : null}

        {!link ? (
          <button className="btn btn-primary btn-block" onClick={generate} disabled={loading}>
            {loading ? <span className="spinner" /> : '🔗'} Gerar link de afiliado
          </button>
        ) : (
          <div className="stack gap-8 fade-in">
            <div className="row gap-8">
              <input className="input grow" readOnly value={shortUrl} onFocus={(e) => e.currentTarget.select()} />
              <button className="btn btn-sm" onClick={copy}>{copied ? '✓' : 'Copiar'}</button>
            </div>
            <div className="row gap-8 wrap">
              <a className="btn btn-sm btn-whats" href={link.whatsappShareUrl} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
              {shareUrls ? (
                <>
                  <a className="btn btn-sm" href={shareUrls.telegram} target="_blank" rel="noreferrer">Telegram</a>
                  <a className="btn btn-sm" href={shareUrls.twitter} target="_blank" rel="noreferrer">X</a>
                  <a className="btn btn-sm" href={shareUrls.facebook} target="_blank" rel="noreferrer">Facebook</a>
                </>
              ) : null}
            </div>
          </div>
        )}

        <a className="tiny muted" href={product.url} target="_blank" rel="noreferrer">
          Ver na {storeLabel(product.marketplace)} ↗
        </a>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <article className="card product" aria-hidden>
      <div className="product-img skeleton" style={{ borderRadius: 0 }} />
      <div className="product-body">
        <div className="skeleton" style={{ height: 14, width: '90%' }} />
        <div className="skeleton" style={{ height: 14, width: '60%' }} />
        <div className="skeleton" style={{ height: 28, width: '45%' }} />
        <div className="skeleton" style={{ height: 40, width: '100%' }} />
      </div>
    </article>
  );
}
