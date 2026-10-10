import Link from 'next/link';
import { centsToBRL, formatPercent } from '@viraliza/core';
import { AgentChat } from '@/components/AgentChat';
import { ProductCard } from '@/components/ProductCard';
import { getCurrentUser } from '@/lib/session';
import { getDashboardStats, getFeed } from '@/lib/services';

export const dynamic = 'force-dynamic';

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint ? <div className="tiny muted">{hint}</div> : null}
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const [stats, feed] = await Promise.all([getDashboardStats(user), getFeed({ sort: 'viral', limit: 4 })]);

  return (
    <div className="stack gap-24">
      <div className="row between wrap gap-12">
        <div>
          <h2 style={{ marginBottom: 4 }}>Olá, {user.name.split(' ')[0]} 👋</h2>
          <p className="muted mb-0">
            Plano <span className="badge">{user.plan === 'free' ? 'Grátis' : user.plan === 'pro' ? 'Pro' : 'Business'}</span>{' '}
            · código de convite <strong>{user.referralCode}</strong>
          </p>
        </div>
        <Link href="/app/explorar" className="btn btn-primary">
          🔥 Achar produtos pra vender
        </Link>
      </div>

      <div className="grid grid-4">
        <Stat label="Saldo disponível" value={centsToBRL(stats.balanceCents)} hint="Saque via PIX a partir de R$ 50" />
        <Stat label="Ganho total" value={centsToBRL(stats.earnedCents)} hint="Comissões aprovadas" />
        <Stat label="Links ativos" value={String(stats.linksCount)} hint={`${stats.clicks} cliques`} />
        <Stat label="Vendas" value={String(stats.sales)} hint={`Conversão ${formatPercent(stats.conversionRate, 1)}`} />
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="stack gap-12">
          <div className="row between">
            <h3 className="mb-0">Seu agente de vendas</h3>
            <Link href="/app/agente" className="small gradient-text bold">Abrir tela cheia →</Link>
          </div>
          <AgentChat authenticated height={430} />
        </div>

        <div className="stack gap-12">
          <h3 className="mb-0">🔥 Bombando agora</h3>
          <div className="grid grid-products" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            {feed.items.map((p) => (
              <ProductCard key={p.id} product={p} authenticated />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
