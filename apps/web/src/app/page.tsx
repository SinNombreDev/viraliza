import Link from 'next/link';
import { PLANS } from '@viraliza/core';
import { ProductCard } from '@/components/ProductCard';
import { Section } from '@/components/Brand';
import { getCurrentUser } from '@/lib/session';
import { getFeed } from '@/lib/services';
import { isMockMode } from '@/lib/config';

export const dynamic = 'force-dynamic';

const STEPS = [
  {
    icon: '🔥',
    title: 'O agente acha o que vende',
    text: 'IA varre Mercado Livre, Shopee e Amazon e ranqueia os produtos mais virais, mais vendidos e mais desejados do Brasil.',
  },
  {
    icon: '🔗',
    title: 'Gera seu link em 1 toque',
    text: 'Cada produto vira um link de afiliado exclusivo, com seu código de rastreio. Sem planilha, sem complicação.',
  },
  {
    icon: '📲',
    title: 'Compartilha em tudo',
    text: 'WhatsApp, Instagram, TikTok, Telegram… texto pronto, com prova social e escassez, pra você só colar e enviar.',
  },
  {
    icon: '💸',
    title: 'Você ganha em cada venda',
    text: 'Alguém comprou pelo seu link? A comissão cai na sua carteira. Saque via PIX. Simples assim.',
  },
];

export default async function HomePage() {
  const [user, feed] = await Promise.all([getCurrentUser(), getFeed({ sort: 'viral', limit: 8 })]);
  const authenticated = Boolean(user);

  return (
    <div className="container">
      <section className="hero">
        <span className="pill">🇧🇷 Feito para o Brasil · Mercado Livre + Shopee + Amazon</span>
        <h1 className="mt-16">
          Transforme os produtos <span className="gradient-text">mais virais</span> em comissão no automático.
        </h1>
        <p className="lead">
          A Viraliza encontra o que mais vende, gera seus links de afiliado e escreve as mensagens prontas pro
          WhatsApp. Você compartilha, alguém compra, você recebe. Um agente de IA faz o trabalho pesado.
        </p>
        <div className="hero-cta">
          <Link href={authenticated ? '/app' : '/entrar'} className="btn btn-primary">
            {authenticated ? 'Ir para meu painel' : 'Começar grátis agora'}
          </Link>
          <Link href="/app/explorar" className="btn">
            🔥 Ver os mais virais
          </Link>
        </div>
        <div className="stat-mini mt-24">
          <div>
            <div className="stat-value gradient-text">3</div>
            <div className="small muted">marketplaces</div>
          </div>
          <div>
            <div className="stat-value gradient-text">{feed.total}+</div>
            <div className="small muted">produtos ranqueados</div>
          </div>
          <div>
            <div className="stat-value gradient-text">1 toque</div>
            <div className="small muted">para gerar o link</div>
          </div>
          <div>
            <div className="stat-value gradient-text">100%</div>
            <div className="small muted">automático</div>
          </div>
        </div>
      </section>

      {isMockMode.marketplaces ? (
        <div className="notice notice-info">
          <strong>Modo demonstração.</strong> Os produtos abaixo são reais em formato, mas de catálogo de exemplo. Conecte
          as chaves de afiliado no <code>.env</code> para puxar dados ao vivo do Mercado Livre, Shopee e Amazon.
        </div>
      ) : null}

      <Section
        title="🔥 Bombando agora"
        subtitle="Os campeões de venda do momento, já com sua comissão estimada."
        action={
          <Link href="/app/explorar" className="btn btn-sm">
            Ver todos
          </Link>
        }
      >
        <div className="grid grid-products">
          {feed.items.map((p) => (
            <ProductCard key={p.id} product={p} authenticated={authenticated} />
          ))}
        </div>
      </Section>

      <Section title="Como funciona" subtitle="Do zero à primeira comissão em minutos.">
        <div className="grid grid-4">
          {STEPS.map((s) => (
            <div key={s.title} className="card">
              <div style={{ fontSize: 30 }}>{s.icon}</div>
              <h3 className="mt-8">{s.title}</h3>
              <p className="small muted mb-0">{s.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Um vendedor de IA no seu WhatsApp"
        subtitle="Converse como com um amigo — ele acha produto, monta o link e escreve a legenda."
      >
        <div className="grid grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <h3>O que o Vira faz por você</h3>
            <ul className="small muted" style={{ lineHeight: 1.9, paddingLeft: 18 }}>
              <li>Acha os produtos mais virais por categoria ou preço</li>
              <li>Gera links de afiliado rastreáveis em 1 clique</li>
              <li>Escreve legendas para WhatsApp, Instagram e TikTok</li>
              <li>Calcula sua comissão e mostra seu saldo</li>
              <li>Responde no WhatsApp 24/7 (com opt-in)</li>
            </ul>
            <Link href="/app/agente" className="btn btn-primary mt-8">
              Conversar com o agente
            </Link>
          </div>
          <div className="card" style={{ background: 'var(--panel-2)' }}>
            <div className="bubble bubble-user" style={{ marginLeft: 'auto' }}>Quero vender algo que vende muito e dá comissão boa</div>
            <div className="bubble bubble-bot mt-16">
              🔥 <strong>Melhor aposta agora:</strong> Fone de Ouvido Bluetooth TWS Pro
              <br />• R$ 89,90 (55% OFF) — 38,2 mil vendidos • 4,8★
              <br />• Comissão estimada <strong>R$ 12,23 por venda</strong>
              <br />
              <br />Diga <strong>&ldquo;gera o link&rdquo;</strong> que eu monto o link + a legenda pronta pro WhatsApp. 📲
            </div>
          </div>
        </div>
      </Section>

      <Section title="Planos simples" subtitle="Comece grátis. Faça upgrade quando escalar.">
        <div className="grid grid-3">
          {(Object.values(PLANS) as (typeof PLANS)['free'][]).map((plan) => (
            <div key={plan.id} className="card card-hover">
              <h3>{plan.name}</h3>
              <div className="stat-value">
                {plan.priceCents === 0 ? 'Grátis' : `R$ ${(plan.priceCents / 100).toFixed(2).replace('.', ',')}`}
                {plan.priceCents > 0 ? <span className="small muted">/mês</span> : null}
              </div>
              <p className="small muted">{plan.description}</p>
              <ul className="small muted" style={{ lineHeight: 1.8, paddingLeft: 18 }}>
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Link href="/precos" className="btn btn-block mt-8">
                Ver detalhes
              </Link>
            </div>
          ))}
        </div>
      </Section>

      <section className="card mt-40 center" style={{ padding: 40, textAlign: 'center', background: 'var(--panel-2)' }}>
        <div>
          <h2>Pronto para viralizar?</h2>
          <p className="lead" style={{ margin: '0 auto 18px' }}>
            Crie sua conta grátis e gere seu primeiro link de afiliado em menos de um minuto.
          </p>
          <Link href={authenticated ? '/app' : '/entrar'} className="btn btn-primary">
            {authenticated ? 'Abrir meu painel' : 'Criar conta grátis'}
          </Link>
        </div>
      </section>
    </div>
  );
}
