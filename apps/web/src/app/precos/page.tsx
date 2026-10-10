import Link from 'next/link';
import { ONE_TIME_PLAN, PLANS, centsToBRL } from '@viraliza/core';
import { getCurrentUser } from '@/lib/session';
import { SubscribeButton } from '@/components/SubscribeButton';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const user = await getCurrentUser();
  const plans = Object.values(PLANS);

  return (
    <div className="container page">
      <div className="center stack" style={{ textAlign: 'center' }}>
        <h1>
          Planos da <span className="gradient-text">Viraliza</span>
        </h1>
        <p className="lead">A Viraliza fica com uma pequena parte da sua comissão como taxa de serviço. Nos planos pagos, essa taxa cai.</p>
      </div>

      <div className="grid grid-3 mt-40">
        {plans.map((plan) => {
          const current = user?.plan === plan.id;
          return (
            <div key={plan.id} className="card card-hover" style={current ? { borderColor: 'var(--brand)' } : undefined}>
              {current ? <span className="badge badge-green">Seu plano</span> : null}
              <h3 className="mt-8">{plan.name}</h3>
              <div className="stat-value">
                {plan.priceCents === 0 ? 'Grátis' : centsToBRL(plan.priceCents)}
                {plan.priceCents > 0 ? <span className="small muted">/mês</span> : null}
              </div>
              <p className="small muted">{plan.description}</p>
              <div className="badge">{plan.platformFeePercent}% taxa Viraliza</div>
              <ul className="small muted mt-16" style={{ lineHeight: 1.9, paddingLeft: 18 }}>
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <div className="mt-16">
                {plan.id === 'free' ? (
                  <Link href={user ? '/app' : '/entrar'} className="btn btn-block">
                    {user ? 'Continuar no Grátis' : 'Começar grátis'}
                  </Link>
                ) : (
                  <SubscribeButton plan={plan.id} authenticated={Boolean(user)} label={`Assinar ${plan.name}`} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card mt-40">
        <div className="row between wrap gap-16">
          <div>
            <h3>{ONE_TIME_PLAN.name}</h3>
            <p className="small muted mb-0">
              Prefere pagar uma vez só? Desbloqueie o Pro para sempre por {centsToBRL(ONE_TIME_PLAN.priceCents)}.
            </p>
          </div>
          <SubscribeButton plan="pro" billing="one_time" authenticated={Boolean(user)} label="Comprar vitalício" />
        </div>
      </div>

      <p className="tiny muted mt-24">
        Ao assinar você concorda com os termos. Pagamentos em fase de demonstração são aplicados instantaneamente;
        em produção usamos Stripe (cartão) e PIX (Brasil).
      </p>
    </div>
  );
}
