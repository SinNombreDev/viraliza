import { AgentChat } from '@/components/AgentChat';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AgentePage() {
  const user = await getCurrentUser();

  return (
    <div className="stack gap-16">
      <div>
        <h2 style={{ marginBottom: 4 }}>Agente de vendas Vira 🤖</h2>
        <p className="muted mb-0">
          Peça produtos, gere links e receba a legenda pronta pro WhatsApp. Ele só fala de dados reais do catálogo.
        </p>
      </div>
      <AgentChat authenticated={Boolean(user)} height={640} />
    </div>
  );
}
