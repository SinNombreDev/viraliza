import Link from 'next/link';
import { Logo } from './Brand';
import { LogoutButton } from './LogoutButton';
import { getCurrentUser } from '@/lib/session';

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Logo href={user ? '/app' : '/'} />
        <div className="nav-links">
          <Link href="/app/explorar">Explorar</Link>
          <Link href="/precos">Preços</Link>
          {user ? (
            <>
              <Link href="/app/agente">Agente IA</Link>
              <Link href="/app/links">Meus links</Link>
              <Link href="/app/carteira">Carteira</Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/entrar">Entrar</Link>
              <Link href="/entrar" className="btn btn-primary btn-sm">
                Começar grátis
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
