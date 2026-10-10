'use client';

import { useState } from 'react';
import { buildSocialShareUrls, centsToBRL, storeLabel, type AffiliateLink } from '@viraliza/core';

export function LinkList({ links }: { links: AffiliateLink[] }) {
  const [origin] = useState(() => (typeof window !== 'undefined' ? window.location.origin : ''));
  const [copied, setCopied] = useState<string | null>(null);

  if (links.length === 0) {
    return <div className="notice notice-warn">Você ainda não criou links. Vá em “Explorar virais” e gere o primeiro!</div>;
  }

  async function copy(code: string) {
    await navigator.clipboard.writeText(`${origin}/r/${code}`);
    setCopied(code);
    setTimeout(() => setCopied(null), 1600);
  }

  return (
    <div className="card" style={{ padding: 0 }}>
      {links.map((link) => {
        const shortUrl = `${origin}/r/${link.code}`;
        const share = buildSocialShareUrls(link.title, shortUrl);
        return (
          <div key={link.id} className="list-row wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="thumb" src={link.imageUrl} alt={link.title} />
            <div className="grow" style={{ minWidth: 200 }}>
              <div className="small bold" style={{ lineHeight: 1.3 }}>{link.title}</div>
              <div className="tiny muted">
                {storeLabel(link.marketplace)} · {link.clicks} cliques · {link.conversions} vendas ·{' '}
                <span style={{ color: 'var(--green)' }}>{centsToBRL(link.earningsCents)}</span>
              </div>
              <div className="tiny" style={{ marginTop: 4 }}>
                <code className="gradient-text">{shortUrl}</code>
              </div>
            </div>
            <div className="row gap-8 wrap">
              <button className="btn btn-sm" onClick={() => copy(link.code)}>
                {copied === link.code ? '✓ Copiado' : 'Copiar'}
              </button>
              <a className="btn btn-sm btn-whats" href={link.whatsappShareUrl} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
              <a className="btn btn-sm" href={share.telegram} target="_blank" rel="noreferrer">Telegram</a>
              <a className="btn btn-sm" href={share.facebook} target="_blank" rel="noreferrer">Facebook</a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
