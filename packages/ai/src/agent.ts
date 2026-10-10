import {
  centsToBRL,
  computeCommissionSplit,
  rankProducts,
  type AgentContext,
  type ChatMessage,
  type PlanId,
  type Product,
  type RankedProduct,
} from '@viraliza/core';
import type { AiProvider } from './provider';
import { SYSTEM_PROMPT, buildProductContext, draftBlock } from './prompts';

export interface CreatedLink {
  code: string;
  shortUrl: string;
  destinationUrl?: string;
  shareText: string;
  whatsappShareUrl: string;
  productId: string;
}

export interface AgentDependencies {
  provider: AiProvider;
  /** Search the marketplace service for products matching a query. */
  searchProducts?: (query: string, limit?: number) => Promise<RankedProduct[]>;
  /** Create a real, persisted affiliate link for a product. */
  createLink?: (productId: string) => Promise<CreatedLink | null>;
}

export interface AgentReplyOptions {
  context?: AgentContext;
  history?: ChatMessage[];
  plan?: PlanId;
}

export interface AgentReply {
  message: ChatMessage;
  /** The link created this turn, if the user asked for one. */
  createdLink?: CreatedLink;
  /** Products the agent surfaced (for the UI to render cards). */
  productIds: string[];
}

/**
 * SalesAgent — orchestrates retrieval (real products) + generation (LLM copy).
 *
 * Retrieval is grounded: the agent only ever talks about products it was given,
 * and it pulls the numbers (price, sales, commission) straight from the data, so
 * it can't hallucinate. Generation is delegated to the provider so the same
 * agent works with the mock or a real LLM.
 */
export class SalesAgent {
  constructor(private readonly deps: AgentDependencies) {}

  async reply(userText: string, options: AgentReplyOptions = {}): Promise<AgentReply> {
    const plan = options.plan ?? options.context?.plan;
    const products = await this.resolveProducts(userText, options.context, plan);

    const wantsLink = /\b(gera(r)?|cria(r)?|faz|manda)\b.*\blink\b|\blink\b.*\bafiliad|\bmeu link\b/i.test(userText);
    const isCommission = /comiss|quanto (eu )?ganho|saldo|saque|pix|receber/i.test(userText);
    const isGreeting = /^(oi|olá|ola|bom dia|boa tarde|boa noite|hey|hi|e a[ií])\b/i.test(userText.trim());

    let createdLink: CreatedLink | undefined;
    const productIds: string[] = [];

    if (wantsLink && this.deps.createLink && products[0]) {
      const link = await this.deps.createLink(products[0].id);
      if (link) {
        createdLink = link;
        productIds.push(products[0].id);
      }
    }

    const draft = this.buildDraft({ userText, products, plan, createdLink, isCommission, isGreeting });

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `${SYSTEM_PROMPT}\n\n${buildProductContext(products)}\n\n${draftBlock(draft)}`,
      },
      ...(options.history ?? []).slice(-6),
      { role: 'user', content: userText },
    ];

    let content: string;
    try {
      const result = await this.deps.provider.complete(messages, { temperature: 0.7, maxTokens: 500 });
      content = result.content.trim() || draft;
    } catch {
      content = draft; // never fail the user because the LLM is down
    }

    if (createdLink) {
      content = `${content}\n\n🔗 Seu link está pronto: ${createdLink.shortUrl}`;
    }

    return {
      message: {
        role: 'assistant',
        content,
        productIds: productIds.length ? productIds : products.slice(0, 3).map((p) => p.id),
        shareText: createdLink?.shareText,
        at: new Date().toISOString(),
      },
      createdLink,
      productIds,
    };
  }

  private async resolveProducts(
    userText: string,
    context?: AgentContext,
    plan?: PlanId,
  ): Promise<RankedProduct[]> {
    if (context?.products?.length) return rankProducts(context.products as Product[], plan);
    if (this.deps.searchProducts) {
      const query = extractQuery(userText);
      try {
        const found = await this.deps.searchProducts(query, 6);
        if (found.length > 0) return found;
        // Nothing matched the (often loosely-worded) query — fall back to the
        // current viral feed so the user always sees something useful.
        if (query) return await this.deps.searchProducts('', 6);
        return found;
      } catch {
        return [];
      }
    }
    return [];
  }

  private buildDraft(args: {
    userText: string;
    products: RankedProduct[];
    plan?: PlanId;
    createdLink?: CreatedLink;
    isCommission: boolean;
    isGreeting: boolean;
  }): string {
    const { products, plan, createdLink, isCommission } = args;
    const top = products[0];

    if (isCommission) {
      if (!top) {
        return 'Sua comissão é o que sobra depois da taxa da Viraliza. No plano Grátis ficamos com 20% da comissão bruta; no Pro, só 15%. Me diga um produto que eu calculo exatamente quanto sobra pra você. 💰';
      }
      const split = computeCommissionSplit({
        orderValueCents: top.priceCents,
        marketplace: top.marketplace,
        plan,
        commissionPercent: top.commissionPercent,
      });
      return (
        `Num produto de ${centsToBRL(top.priceCents)} (${top.title.slice(0, 40)}…):\n` +
        `• Comissão bruta da loja: ${centsToBRL(split.grossCommissionCents)} (${split.commissionPercent}%)\n` +
        `• Taxa da Viraliza: ${centsToBRL(split.platformFeeCents)} (${split.platformFeePercent}%)\n` +
        `• **Você recebe: ${centsToBRL(split.netCommissionCents)} por venda** 💸`
      );
    }

    if (!products.length) {
      return 'Não encontrei produtos para essa busca agora. Tente outro termo, uma categoria (ex.: "beleza", "casa") ou me peça os **mais virais do momento**. 🔥';
    }

    const lines: string[] = [];
    if (createdLink) {
      lines.push(`Prontinho! Gerei seu link de afiliado para **${top!.title}**.`);
      lines.push('');
      lines.push(`📲 Legenda pronta pro WhatsApp:\n"""${createdLink.shareText}"""`);
      lines.push('');
      lines.push('É só copiar e colar nos seus grupos e status. Cada venda cai na sua comissão. 🚀');
      return lines.join('\n');
    }

    lines.push(`🔥 **Melhor aposta agora:** ${top!.title}`);
    lines.push(
      `• ${centsToBRL(top!.priceCents)}${top!.discountPercent ? ` (${top!.discountPercent}% OFF)` : ''} — ${top!.viralReasons.join(' • ')}`,
    );
    lines.push(`• Viral ${top!.viralScore}/100 • comissão estimada ${centsToBRL(top!.estimatedNetCommissionCents)} por venda`);
    for (const p of products.slice(1, 3)) {
      lines.push(`• Alternativa: ${p.title} — ${centsToBRL(p.priceCents)} (viral ${p.viralScore}/100)`);
    }
    lines.push('');
    lines.push('Diga **"gera o link"** que eu monto o link de afiliado e a legenda pronta pro WhatsApp. 📲');
    return lines.join('\n');
  }
}

/** Heuristic query extraction: strip filler verbs the user types naturally. */
export function extractQuery(text: string): string {
  const cleaned = text
    .replace(/^(quero|me (mostra|mostre|manda|d[êe])|busca(r|que)?|procura(r)?|acha(r)?|encontra(r)?|o que|quais|qual)\b/gi, '')
    .replace(/\b(mais )?(viral|virais|vendid[oa]s?|bombando|top|melhor(es)?|pra vender|para vender)\b/gi, '')
    .replace(/[?!.]/g, ' ')
    .trim();
  return cleaned.length >= 2 ? cleaned : text.trim();
}
