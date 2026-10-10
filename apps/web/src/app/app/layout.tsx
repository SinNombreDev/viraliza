import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

const TABS = [
  { href: '/app', label: 'Painel' },
  { href: '/app/explorar', label: 'Explorar virais' },
  { href: '/app/agente', label: 'Agente IA' },
  { href: '/app/links', label: 'Meus links' },
  { href: '/app/carteira', label: 'Carteira' },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/entrar?next=/app');

  return (
    <div className="container page">
      <div className="toolbar" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className="chip">
            {t.label}
          </Link>
        ))}
      </div>
      <div className="mt-24">{children}</div>
    </div>
  );
}
