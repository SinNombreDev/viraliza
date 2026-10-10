'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { PlanId } from '@viraliza/core';

export function SubscribeButton({
  plan,
  billing = 'monthly',
  authenticated,
  label,
}: {
  plan: PlanId;
  billing?: 'monthly' | 'one_time';
  authenticated: boolean;
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function subscribe() {
    if (!authenticated) {
      router.push('/entrar?next=/precos');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan, billing }),
      });
      if (res.ok) {
        setDone(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) return <div className="badge badge-green">✓ Plano ativo</div>;

  return (
    <button className="btn btn-primary btn-block" onClick={subscribe} disabled={loading}>
      {loading ? <span className="spinner" /> : '⚡'} {label}
    </button>
  );
}
