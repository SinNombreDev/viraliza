import Link from 'next/link';
import type { ReactNode } from 'react';

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="logo">
      <span className="logo-badge">⚡</span>
      <span>
        Viral<span className="gradient-text">iza</span>
      </span>
    </Link>
  );
}

export function Section({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="mt-40">
      <div className="row between wrap gap-12">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p className="muted" style={{ marginBottom: 0 }}>{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-16">{children}</div>
    </section>
  );
}
