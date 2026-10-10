import { CloudWhatsAppProvider } from './cloud';
import { MockWhatsAppProvider } from './mock';
import type { WhatsAppConfig, WhatsAppProvider } from './provider';

export function createWhatsAppProvider(config: WhatsAppConfig): WhatsAppProvider {
  if (config.provider === 'cloud' && config.phoneNumberId && config.accessToken) {
    return new CloudWhatsAppProvider(config);
  }
  return new MockWhatsAppProvider();
}
