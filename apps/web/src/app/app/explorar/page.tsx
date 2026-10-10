import { FeedExplorer } from '@/components/FeedExplorer';
import { getCurrentUser } from '@/lib/session';
import { getMarketplaceService } from '@/lib/services';

export const dynamic = 'force-dynamic';

export default async function ExplorarPage() {
  const user = await getCurrentUser();
  const status = getMarketplaceService().status();

  return (
    <div className="stack gap-16">
      <div>
        <h2 style={{ marginBottom: 4 }}>Explorar produtos virais</h2>
        <p className="muted mb-0">
          Filtre por loja, categoria e ordenação. Gere seu link de afiliado e compartilhe — a comissão é sua.
        </p>
      </div>

      <div className="toolbar">
        {Object.entries(status).map(([name, s]) => (
          <span key={name} className={`badge ${s.live ? 'badge-green' : ''}`}>
            {name === 'mercadolivre' ? 'Mercado Livre' : name === 'shopee' ? 'Shopee' : 'Amazon'}:{' '}
            {s.live ? 'ao vivo' : 'demo'}
          </span>
        ))}
      </div>

      <FeedExplorer authenticated={Boolean(user)} />
    </div>
  );
}
