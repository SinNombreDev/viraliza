import type {
  OutboundImage,
  OutboundText,
  SendResult,
  WhatsAppConfig,
  WhatsAppProvider,
} from './provider';

/** Meta WhatsApp Cloud API provider. */
export class CloudWhatsAppProvider implements WhatsAppProvider {
  readonly name = 'cloud';
  private readonly base: string;

  constructor(private readonly config: WhatsAppConfig) {
    const version = config.apiVersion ?? 'v21.0';
    this.base = `https://graph.facebook.com/${version}/${config.phoneNumberId}`;
  }

  async sendText(message: OutboundText): Promise<SendResult> {
    return this.post({
      messaging_product: 'whatsapp',
      to: message.to.replace(/[^\d]/g, ''),
      type: 'text',
      text: { body: message.body, preview_url: message.previewUrl ?? true },
    });
  }

  async sendImage(message: OutboundImage): Promise<SendResult> {
    return this.post({
      messaging_product: 'whatsapp',
      to: message.to.replace(/[^\d]/g, ''),
      type: 'image',
      image: { link: message.imageUrl, caption: message.caption },
    });
  }

  /** Send a pre-approved template (required for business-initiated messages). */
  async sendTemplate(to: string, templateName: string, language = 'pt_BR', params: string[] = []): Promise<SendResult> {
    return this.post({
      messaging_product: 'whatsapp',
      to: to.replace(/[^\d]/g, ''),
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        components: params.length
          ? [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }]
          : [],
      },
    });
  }

  private async post(payload: Record<string, unknown>): Promise<SendResult> {
    const res = await fetch(this.base, {
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.config.accessToken}`,
      },
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const raw = (await res.json().catch(() => ({}))) as {
      messages?: { id: string }[];
      error?: unknown;
    };
    return {
      id: raw.messages?.[0]?.id ?? '',
      provider: this.name,
      accepted: res.ok,
      raw,
    };
  }
}
