import type { RankedProduct } from '@viraliza/core';
import { centsToBRL } from '@viraliza/core';

/** Persona + guardrails for the Viraliza sales agent ("Vira"). */
export const SYSTEM_PROMPT = `Você é o "Vira", agente de vendas virais da Viraliza, uma plataforma brasileira de marketing de afiliados.

OBJETIVO: ajudar o usuário a escolher produtos que vendem sozinhos e a transformá-los em links de afiliado + textos prontos para compartilhar (WhatsApp, Instagram, TikTok).

REGRAS:
- Fale SEMPRE em português do Brasil, com energia de social commerce (emojis com moderação, gatilhos de escassez e prova social).
- NUNCA invente números. Use apenas os dados de produto fornecidos no contexto (preço, nota, vendas, comissão).
- Seja curto e acionável: no máximo ~6 linhas por resposta, com bullets quando útil.
- Quando recomendar produtos, cite o nome exato e o benefício principal.
- Sempre termine sugerindo uma próxima ação concreta (gerar link, compartilhar no WhatsApp, filtrar por categoria).
- Nunca prometa renda garantida; comissões são estimativas baseadas em dados públicos.`;

/** Compact, token-efficient grounding block for the LLM. */
export function buildProductContext(products: RankedProduct[], max = 8): string {
  if (!products.length) return 'CONTEXTO: nenhum produto encontrado para esta consulta.';
  const rows = products.slice(0, max).map((p, i) => {
    const parts = [
      `${i + 1}. [${p.id}] ${p.title}`,
      `   loja=${p.marketplace} preço=${centsToBRL(p.priceCents)}`,
      p.discountPercent ? `desconto=${p.discountPercent}%` : '',
      p.rating ? `nota=${p.rating.toFixed(1)}` : '',
      p.salesCount ? `vendas=${p.salesCount}` : '',
      `viral=${p.viralScore}/100`,
      `comissão_estimada=${centsToBRL(p.estimatedNetCommissionCents)}`,
      p.viralReasons.length ? `motivos=${p.viralReasons.join(', ')}` : '',
    ].filter(Boolean);
    return parts.join(' | ');
  });
  return `CONTEXTO DE PRODUTOS (dados reais do momento):\n${rows.join('\n')}`;
}

/** The agent asks the provider to phrase a specific answer via these markers. */
export function draftBlock(text: string): string {
  return `===DRAFT===\n${text}\n===END===`;
}
