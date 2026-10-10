import Link from 'next/link';
import { PLANS, centsToBRL } from '@viraliza/core';
import { LinkList } from '@/components/LinkList';
import { getCurrentUser } from '@/lib/session';
import { listLinks } from '@/lib/services';

export const dynamic = 'force-dynamic';

export default async function LinksPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const links = await listLinks(user.id);
  const plan = PLANS[user.plan];
  const max = plan.maxActiveLinks;

  return (
    <div className="stack gap-16">
      <div className="row between wrap gap-12">
        <div>
          <h2 style={{ marginBottom: 4 }}>Meus links de afiliado</h2>
          <p className="muted mb-0">
            {links.length} {max !== null ? `de ${max}` : ''} links · compartilhe em qualquer lugar e acompanhe os cliques.
          </p>
        </div>
        <Link href="/app/explorar" className="btn btn-primary">+ Novo link</Link>
      </div>

      {max !== null && links.length >= max ? (
        <div className="notice notice-warn">
          Você atingiu o limite do plano {plan.name}. <Link href="/precos" className="gradient-text bold">Faça upgrade</Link> para links ilimitados.
        </div>
      ) : null}

      <LinkList links={links} />
    </div>
  );
}
