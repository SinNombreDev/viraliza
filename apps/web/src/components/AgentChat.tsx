'use client';

import { useEffect, useRef, useState } from 'react';
import type { AffiliateLink, ChatMessage, RankedProduct } from '@viraliza/core';
import { centsToBRL } from '@viraliza/core';

interface UiMessage {
  role: 'user' | 'assistant';
  content: string;
  products?: RankedProduct[];
  link?: AffiliateLink | null;
}

const SUGGESTIONS = [
  'O que está bombando agora?',
  'Fone bluetooth',
  'Produtos de beleza',
  'Quanto eu ganho por venda?',
  'Gera o link do primeiro',
];

function renderRich(text: string) {
  // Minimal **bold** + line rendering without a markdown dependency.
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={j}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={j}>{part}</span>
      ),
    );
    return (
      <span key={i}>
        {parts}
        {i < text.split('\n').length - 1 ? <br /> : null}
      </span>
    );
  });
}

export function AgentChat({ authenticated, height = 560 }: { authenticated: boolean; height?: number }) {
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      role: 'assistant',
      content:
        'Olá! 👋 Eu sou o **Vira**, seu agente de vendas virais.\n\nEu acho os produtos que mais vendem no Mercado Livre, Shopee e Amazon e monto seu link de afiliado + a legenda pronta pro WhatsApp.\n\nO que você quer vender hoje? 🔥',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    setInput('');
    const history: ChatMessage[] = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message, history }),
      });
      const data = (await res.json()) as {
        message: ChatMessage;
        products: RankedProduct[];
        createdLink: AffiliateLink | null;
      };
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.message.content, products: data.products, link: data.createdLink },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Ops, tive um problema de conexão. Pode tentar novamente? 🙏' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card chat" style={{ height, padding: 0, overflow: 'hidden' }}>
      <div className="chat-scroll" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className="stack gap-8">
            <div className={`bubble ${m.role === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
              {m.role === 'assistant' ? renderRich(m.content) : m.content}
            </div>

            {m.link ? (
              <div className="bubble bubble-bot" style={{ alignSelf: 'flex-start' }}>
                🔗 <a href={m.link.whatsappShareUrl} target="_blank" rel="noreferrer" className="gradient-text bold">
                  Compartilhar no WhatsApp
                </a>
              </div>
            ) : null}

            {m.products && m.products.length > 0 ? (
              <div className="stack gap-8" style={{ alignSelf: 'flex-start', width: '82%' }}>
                {m.products.slice(0, 3).map((p) => (
                  <div key={p.id} className="row gap-12" style={{ background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 10 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="thumb" src={p.imageUrl} alt={p.title} />
                    <div className="grow">
                      <div className="small bold" style={{ lineHeight: 1.3 }}>{p.title}</div>
                      <div className="tiny muted">
                        {centsToBRL(p.priceCents)} · viral {p.viralScore} · 💰 {centsToBRL(p.estimatedNetCommissionCents)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {loading ? (
          <div className="bubble bubble-bot row gap-8">
            <span className="spinner" /> pensando…
          </div>
        ) : null}
      </div>

      <div className="chat-suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="chip" onClick={() => send(s)} disabled={loading} type="button">
            {s}
          </button>
        ))}
      </div>

      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="input grow"
          placeholder="Ex.: me mostra os mais virais de beleza…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button className="btn btn-primary" type="submit" disabled={loading || !input.trim()}>
          Enviar
        </button>
      </form>

      {!authenticated ? (
        <div className="tiny muted" style={{ padding: '0 16px 12px' }}>
          <a href="/entrar" className="gradient-text bold">Entre</a> para o agente gerar e salvar seus links de afiliado automaticamente.
        </div>
      ) : null}
    </div>
  );
}
