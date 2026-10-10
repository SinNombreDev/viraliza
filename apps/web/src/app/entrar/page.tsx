'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState(params.get('ref') ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, name, referralCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível entrar.');
      router.push(params.get('next') ?? '/app');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  const demo = () => {
    setEmail('demo@viraliza.app');
  };

  return (
    <div className="container" style={{ maxWidth: 460, padding: '60px 20px' }}>
      <div className="card">
        <h2>Entrar na Viraliza</h2>
        <p className="small muted">
          Login rápido por e-mail (em produção usamos código por WhatsApp). Crie sua conta na hora.
        </p>

        <form className="stack gap-12 mt-16" onSubmit={submit}>
          <label className="small bold">
            E-mail
            <input
              className="input btn-block mt-8"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
            />
          </label>
          <label className="small bold">
            Nome (opcional)
            <input
              className="input btn-block mt-8"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
          </label>
          <label className="small bold">
            Código de convite (opcional)
            <input
              className="input btn-block mt-8"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="Quem te convidou"
            />
          </label>

          {error ? <div className="tiny" style={{ color: 'var(--red)' }}>{error}</div> : null}

          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <span className="spinner" /> : '⚡'} Entrar / Criar conta
          </button>
        </form>

        <hr className="divider" />

        <button className="btn btn-block" onClick={demo} type="button">
          Usar conta de demonstração
        </button>
        <p className="tiny muted mt-8" style={{ marginBottom: 0 }}>
          Dica: a conta <strong>demo@viraliza.app</strong> já vem com links e comissões de exemplo.
        </p>
      </div>
    </div>
  );
}

export default function EntrarPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: 60 }}>Carregando…</div>}>
      <LoginForm />
    </Suspense>
  );
}
