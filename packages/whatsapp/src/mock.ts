import {
  mockOutbox,
  type OutboundImage,
  type OutboundText,
  type SendResult,
  type WhatsAppProvider,
} from './provider';

let counter = 0;
const nextId = () => `wamid.mock.${Date.now()}.${(counter += 1)}`;

export class MockWhatsAppProvider implements WhatsAppProvider {
  readonly name = 'mock';

  async sendText(message: OutboundText): Promise<SendResult> {
    const id = nextId();
    mockOutbox.push({ id, type: 'text', to: message.to, body: message.body, at: new Date().toISOString() });
    return { id, provider: this.name, accepted: true };
  }

  async sendImage(message: OutboundImage): Promise<SendResult> {
    const id = nextId();
    mockOutbox.push({
      id,
      type: 'image',
      to: message.to,
      imageUrl: message.imageUrl,
      body: message.caption,
      at: new Date().toISOString(),
    });
    return { id, provider: this.name, accepted: true };
  }
}
