import { centsToBRL } from '@viraliza/core';
import { getCurrentUser } from '@/lib/session';
import { getWalletSummary } from '@/lib/services';

export const dynamic = 'force-dynamic';

const TYPE_LABEL: Record<string, string> = {
  commission: 'Comissão',
  referral_bonus: 'Bônus de indicação',
  payout: 'Saque',
  subscription: 'Assinatura',
  adjustment: 'Ajuste',
};

export default async function CarteiraPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const wallet = await getWalletSummary(user);
  const canWithdraw = wallet.balanceCents >= 5000;

  return (
    <div className="stack gap-24">
      <div>
        <h2 style={{ marginBottom: 4 }}>Minha carteira</h2>
        <p className="muted mb-0">Acompanhe seus ganhos e faça saque via PIX.</p>
      </div>

      <div className="grid grid-3">
        <div className="card stat">
          <div className="stat-label">Saldo disponível</div>
          <div className="stat-value gradient-text">{centsToBRL(wallet.balanceCents)}</div>
        </div>
        <div className="card stat">
          <div className="stat-label">A receber (pendente)</div>
          <div className="stat-value">{centsToBRL(wallet.pendingCents)}</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Total histórico</div>
          <div className="stat-value">{centsToBRL(wallet.lifetimeCents)}</div>
        </div>
      </div>

      <div className={`notice ${canWithdraw ? 'notice-info' : 'notice-warn'}`}>
        {canWithdraw ? (
          <>✅ Você pode sacar via PIX. O saque mínimo é R$ 50,00 e cai em até 2 dias úteis.</>
        ) : (
          <>💰 Você precisa de R$ 50,00 de saldo para sacar (faltam {centsToBRL(5000 - wallet.balanceCents)}).</>
        )}
      </div>

      <div className="stack gap-12">
        <h3 className="mb-0">Extrato</h3>
        <div className="card" style={{ padding: 0 }}>
          {wallet.entries.length === 0 ? (
            <div className="list-row muted">Nenhuma movimentação ainda.</div>
          ) : (
            wallet.entries.map((e) => (
              <div key={e.id} className="list-row">
                <div className="grow">
                  <div className="small bold">{e.description}</div>
                  <div className="tiny muted">
                    {TYPE_LABEL[e.type] ?? e.type} · {new Date(e.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div style={{ color: e.amountCents >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                  {e.amountCents >= 0 ? '+' : ''}
                  {centsToBRL(e.amountCents)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="stack gap-12">
        <h3 className="mb-0">Vendas atribuídas</h3>
        <div className="card" style={{ padding: 0 }}>
          {wallet.conversions.length === 0 ? (
            <div className="list-row muted">Nenhuma venda registrada ainda.</div>
          ) : (
            wallet.conversions.map((c) => (
              <div key={c.id} className="list-row">
                <div className="grow">
                  <div className="small bold">
                    Venda de {centsToBRL(c.orderValueCents)} · {c.marketplace}
                  </div>
                  <div className="tiny muted">
                    Bruto {centsToBRL(c.grossCommissionCents)} · taxa {centsToBRL(c.platformFeeCents)} ·{' '}
                    {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="row gap-8">
                  <span className={`badge ${c.status === 'approved' || c.status === 'paid' ? 'badge-green' : ''}`}>
                    {c.status}
                  </span>
                  <strong style={{ color: 'var(--green)' }}>+{centsToBRL(c.netCommissionCents)}</strong>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
