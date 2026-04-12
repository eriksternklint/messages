import { dispatch } from '@/lib/events';
import { normalizeWhatsApp } from '@/lib/events/sources/whatsapp';
import { useNodeStore } from '@/store';

/**
 * Demo helper that injects a realistic inbound WhatsApp message via
 * the same DMA third-party chat normalizer a real provider would hit.
 * Returns the channel id that received the message so callers can
 * switch focus to it.
 */
const DEMO_MESSAGES = [
  "Hey — can you send me the link to that restaurant we talked about?",
  'Quick question: did you sign the lease yet, or are you still thinking?',
  "Just got back from the trip. Let me know when you're free to catch up this week.",
  'Can we move Thursday coffee to Friday? Something came up at work.',
  "I'll get back to you tomorrow with an answer on the apartment.",
];

const DEMO_CONTACTS = [
  { phone: '+15550001234', name: 'Priya' },
  { phone: '+15550005678', name: 'Daniel' },
  { phone: '+15550009012', name: 'Rae' },
];

export function injectWhatsAppDemo(preferredChannelId?: string): string | null {
  const state = useNodeStore.getState();

  let target =
    preferredChannelId && state.channelsById[preferredChannelId]?.kind === 'whatsapp-chat'
      ? state.channelsById[preferredChannelId]
      : Object.values(state.channelsById).find((c) => c.kind === 'whatsapp-chat');

  if (!target) return null;

  const text = DEMO_MESSAGES[Math.floor(Math.random() * DEMO_MESSAGES.length)];
  const from = DEMO_CONTACTS[Math.floor(Math.random() * DEMO_CONTACTS.length)];

  const event = normalizeWhatsApp({
    id: `demo-${Date.now()}`,
    chatId: target.whatsappChatId ?? target.id.replace('wa:', ''),
    from,
    timestamp: new Date().toISOString(),
    text,
  });
  dispatch(event);
  return target.id;
}
