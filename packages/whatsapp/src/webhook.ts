/**
 * Inbound webhook parsing + verification for the Meta WhatsApp Cloud API.
 *
 * The verification handshake (GET) proves we own the endpoint; incoming
 * messages (POST) are normalised into a small, stable shape the app can route.
 */

export interface RawInboundMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  button?: { text: string; payload?: string };
  interactive?: {
    button_reply?: { id?: string; title: string };
    list_reply?: { id?: string; title: string };
  };
}

export interface WebhookPayload {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: {
        messaging_product?: string;
        metadata?: { phone_number_id?: string; display_phone_number?: string };
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: RawInboundMessage[];
      };
    }>;
  }>;
}

export interface InboundMessage {
  /** WhatsApp message id (wamid...). */
  id: string;
  /** Sender phone in E.164 (digits only). */
  from: string;
  /** Sender display name, when provided. */
  name?: string;
  type: 'text' | 'button' | 'interactive' | 'image' | 'audio' | 'unknown';
  /** Text content or button/interactive title. */
  text: string;
  timestamp: string;
}

/** The GET verification handshake. Returns the challenge to echo, or null. */
export function verifyWebhook(
  params: { 'hub.mode'?: string; 'hub.verify_token'?: string; 'hub.challenge'?: string },
  expectedToken: string,
): string | null {
  if (params['hub.mode'] === 'subscribe' && params['hub.verify_token'] === expectedToken) {
    return params['hub.challenge'] ?? '';
  }
  return null;
}

/** Flatten a webhook POST body into normalised inbound messages. */
export function parseInbound(payload: WebhookPayload): InboundMessage[] {
  const out: InboundMessage[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value) continue;
      const name = value.contacts?.[0]?.profile?.name;
      for (const msg of value.messages ?? []) {
        out.push(normalise(msg, name));
      }
    }
  }
  return out;
}

function normalise(msg: RawInboundMessage, name?: string): InboundMessage {
  const base = { id: msg.id, from: msg.from, name, timestamp: msg.timestamp };
  switch (msg.type) {
    case 'text':
      return { ...base, type: 'text', text: msg.text?.body ?? '' };
    case 'button':
      return { ...base, type: 'button', text: msg.button?.text ?? '' };
    case 'interactive':
      return {
        ...base,
        type: 'interactive',
        text: msg.interactive?.button_reply?.title ?? msg.interactive?.list_reply?.title ?? '',
      };
    case 'image':
      return { ...base, type: 'image', text: '' };
    case 'audio':
      return { ...base, type: 'audio', text: '' };
    default:
      return { ...base, type: 'unknown', text: '' };
  }
}
