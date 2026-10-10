import { centsToBRL, type AffiliateLink, type RankedProduct } from '@viraliza/core';

/** Message templates used by the WhatsApp bot and opt-in broadcasts (pt-BR). */

export function welcomeMessage(name?: string): string {
  return (
    `Olá${name ? ` ${name.split(' ')[0]}` : ''}! 👋 Sou o *Vira*, seu agente de vendas virais da Viraliza.\n\n` +
    'Eu acho os produtos que mais vendem na Shopee, Mercado Livre e Amazon e monto seu link de afiliado.\n\n' +
    'Me diga o que você quer vender (ex.: *fone*, *beleza*, *casa*) ou envie *TOP* para ver os mais virais de hoje. 🔥'
  );
}

export function helpMessage(): string {
  return (
    '*Como usar a Viraliza aqui no WhatsApp:*\n\n' +
    '• Envie um termo (ex.: _airfryer_) e eu acho os mais virais\n' +
    '• Envie *TOP* para os campeões do dia\n' +
    '• Envie *COMISSÃO* para entender seus ganhos e saldo\n' +
    '• Escolha um produto e eu gero seu link + legenda pronta\n\n' +
    'Quanto mais você compartilha, mais comissão você acumula. 💸'
  );
}

export function linkReadyMessage(link: AffiliateLink): string {
  return (
    `✅ Link de afiliado pronto!\n\n` +
    `🛍️ *${link.title}*\n\n` +
    `É só compartilhar nos seus grupos e status:\n` +
    `📲 ${link.whatsappShareUrl.split('?')[0]}\n\n` +
    `Seu link exclusivo: ${link.code}\n` +
    `Cada venda rende comissão pra você. 🚀`
  );
}

export function dailyTopMessage(products: RankedProduct[]): string {
  const lines = products.slice(0, 5).map((p, i) => {
    const discount = p.discountPercent ? ` (${p.discountPercent}% OFF)` : '';
    return `${i + 1}. *${p.title}* — ${centsToBRL(p.priceCents)}${discount}\n   viral ${p.viralScore}/100 • comissão ${centsToBRL(p.estimatedNetCommissionCents)}`;
  });
  return `🔥 *Top 5 virais de hoje*\n\n${lines.join('\n\n')}\n\nResponda com o número do produto que eu gero seu link. 📲`;
}

export function commissionMessage(params: {
  balanceCents: number;
  lifetimeCents: number;
  pendingCents: number;
}): string {
  return (
    `💰 *Seus ganhos na Viraliza*\n\n` +
    `• Saldo disponível: ${centsToBRL(params.balanceCents)}\n` +
    `• A receber (pendente): ${centsToBRL(params.pendingCents)}\n` +
    `• Total histórico: ${centsToBRL(params.lifetimeCents)}\n\n` +
    `Saque mínimo de R$ 50,00 via PIX, direto no app. Quer que eu busque mais produtos pra vender? 🔥`
  );
}

export function shareCaption(product: RankedProduct, shortUrl: string): string {
  const discount = product.discountPercent ? `🏷️ ${product.discountPercent}% OFF\n` : '';
  return (
    `🔥 ${product.title}\n` +
    discount +
    `💰 Agora por ${centsToBRL(product.priceCents)}\n` +
    (product.rating ? `⭐ ${product.rating.toFixed(1)} • ` : '') +
    (product.salesCount ? `✅ ${product.salesCount}+ vendidos\n` : '\n') +
    `🛒 ${shortUrl}\n` +
    `⏰ Corre que é por tempo limitado!`
  );
}
