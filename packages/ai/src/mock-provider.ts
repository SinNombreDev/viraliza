import type { ChatMessage } from '@viraliza/core';
import type { AiProvider, ChatCompletionOptions, ChatCompletionResult } from './provider';

/**
 * Deterministic, dependency-free "LLM" used in mock mode.
 *
 * It is intentionally rule-based rather than random so the product is testable
 * and the demo is coherent. The SalesAgent does the heavy lifting (grounding in
 * real product data); this provider simply turns the structured instructions it
 * receives into natural pt-BR prose. Swap in OpenAI/Azure for free-form chat.
 */
export class MockAiProvider implements AiProvider {
  readonly name = 'mock';

  async complete(messages: ChatMessage[], _options?: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const user = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    const system = messages.find((m) => m.role === 'system')?.content ?? '';
    const intent = detectIntent(user);

    // The agent embeds a machine-readable block it wants phrased.
    const draft = extractDraft(system) ?? extractDraft(user);

    let content: string;
    switch (intent) {
      case 'greeting':
        content =
          'Olá! 👋 Eu sou o **Vira**, seu agente de vendas virais.\n\n' +
          'Eu encontro os produtos que mais vendem no Mercado Livre, Shopee e Amazon, ' +
          'monto seus links de afiliado e escrevo a mensagem pronta pro WhatsApp.\n\n' +
          'Quer que eu busque o que está **bombando agora**? 🔥';
        break;
      case 'commission':
        content = draft ?? 'Sua comissão é a remuneração da sua indicação: descontamos só a taxa da Viraliza e o resto é seu. 💸 Quer que eu simule quanto você ganha com um produto específico?';
        break;
      case 'help':
        content =
          'Eu posso:\n' +
          '• 🔥 **Achar os produtos mais virais** por categoria, preço ou marketplace\n' +
          '• 🔗 **Gerar seu link de afiliado** em 1 toque\n' +
          '• ✍️ **Escrever a legenda** pronta pra WhatsApp, Instagram e TikTok\n' +
          '• 💰 **Calcular sua comissão** e seu saldo\n\n' +
          'Só me dizer o que você vende ou o nicho que você quer atacar!';
        break;
      default:
        content = draft ?? buildFallback(user);
        break;
    }

    return { content };
  }
}

type Intent = 'greeting' | 'commission' | 'help' | 'products';

function detectIntent(text: string): Intent {
  const t = text.toLowerCase();
  if (/^(oi|ola|olá|bom dia|boa tarde|boa noite|e a[ií]|hey|hi)/.test(t.trim())) return 'greeting';
  if (/(comiss|quanto (eu )?ganho|saldo|pagamento|saque|pix)/.test(t)) return 'commission';
  if (/(ajuda|como funciona|o que voc[eê] faz|help)/.test(t)) return 'help';
  return 'products';
}

function extractDraft(text: string): string | null {
  const marker = '===DRAFT===';
  const end = '===END===';
  const i = text.indexOf(marker);
  if (i === -1) return null;
  const j = text.indexOf(end, i + marker.length);
  return text.slice(i + marker.length, j === -1 ? undefined : j).trim() || null;
}

function buildFallback(text: string): string {
  return (
    `Boa! Vou procurar os produtos mais virais relacionados a **"${text.slice(0, 60)}"**. ` +
    'Enquanto isso, posso já montar seu link de afiliado e a legenda pronta pro WhatsApp — é só escolher um item da lista. 🔥'
  );
}
