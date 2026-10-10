/**
 * WhatsApp provider abstraction.
 *
 * `mock`  — records messages in an in-memory outbox; used in dev and demos.
 * `cloud` — Meta WhatsApp Cloud API (graph.facebook.com).
 *
 * Business note: unsolicited bulk messaging violates WhatsApp policy. Viraliza
 * only sends to numbers that opted in (bot conversation or explicit consent),
 * which is why outbound "broadcast" always goes through a template + opt-in.
 */

export interface OutboundText {
  to: string;
  body: string;
  previewUrl?: boolean;
}

export interface OutboundImage {
  to: string;
  imageUrl: string;
  caption?: string;
}

export interface SendResult {
  id: string;
  provider: string;
  accepted: boolean;
  /** Raw provider response for auditing. */
  raw?: unknown;
}

export interface WhatsAppProvider {
  readonly name: string;
  sendText(message: OutboundText): Promise<SendResult>;
  sendImage(message: OutboundImage): Promise<SendResult>;
}

export interface WhatsAppConfig {
  provider: 'mock' | 'cloud';
  phoneNumberId?: string;
  accessToken?: string;
  verifyToken: string;
  businessAccountId?: string;
  apiVersion?: string;
}

export interface MockOutboxEntry {
  id: string;
  type: 'text' | 'image';
  to: string;
  body?: string;
  imageUrl?: string;
  at: string;
}

/** Shared in-memory outbox so the dev UI can show "sent" WhatsApp messages. */
export const mockOutbox: MockOutboxEntry[] = [];
