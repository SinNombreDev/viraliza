import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Viraliza — Venda automática dos produtos mais virais',
  description:
    'Encontre os produtos mais vendidos e desejados do Mercado Livre, Shopee e Amazon, gere links de afiliado em 1 toque e compartilhe no WhatsApp. Ganhe comissão em cada venda.',
  applicationName: 'Viraliza',
  keywords: ['afiliados', 'mercado livre', 'shopee', 'amazon', 'whatsapp', 'vendas', 'comissão', 'viral'],
};

export const viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Nav />
        <main>{children}</main>
        <footer className="footer">
          <div className="container row between wrap gap-16">
            <span>© {new Date().getFullYear()} Viraliza · Marketing de afiliados no Brasil</span>
            <span className="tiny">
              Comissões são estimativas. Viraliza é uma plataforma independente, não afiliada às lojas parceiras.
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
