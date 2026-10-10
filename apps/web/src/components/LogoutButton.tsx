'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      className="btn btn-sm btn-ghost"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
        router.refresh();
      }}
    >
      Sair
    </button>
  );
}
