import type { InboundEvent, Message } from '@/types';

/**
 * Mocked DMA third-party chat payload shape. Under DMA interop rules,
 * a provider delivers inbound messages as signed webhooks; we simulate
 * that contract locally so the rest of the app is indifferent to
 * whether WhatsApp is real or mocked.
 */
export interface WhatsAppInboundPayload {
  id: string;
  chatId: string;
  from: { phone: string; name?: string; avatarUrl?: string };
  timestamp: string;
  text: string;
  mediaUrl?: string;
  mediaMime?: string;
}

export function normalizeWhatsApp(payload: WhatsAppInboundPayload): InboundEvent {
  const message: Message = {
    id: `wa:${payload.id}`,
    source: 'whatsapp',
    sourceRef: { externalId: payload.id },
    channelId: `wa:${payload.chatId}`,
    author: {
      id: payload.from.phone,
      name: payload.from.name ?? payload.from.phone,
      avatarUrl: payload.from.avatarUrl,
      kind: 'human',
    },
    createdAt: payload.timestamp,
    blocks: payload.mediaUrl
      ? [
          { type: 'text', content: payload.text },
          {
            type: 'file',
            name: 'attachment',
            url: payload.mediaUrl,
            mime: payload.mediaMime ?? 'application/octet-stream',
          },
        ]
      : [{ type: 'text', content: payload.text }],
    rawText: payload.text,
  };

  return { kind: 'whatsapp.inbound', message };
}
