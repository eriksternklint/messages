import { dispatch, subscribe } from '@/lib/events';
import { useNodeStore } from '@/store';
import type { Channel, Message } from '@/types';

/**
 * The Auto-Demo Loop — runs in the browser while the app is open so
 * the product feels alive. Three schedules:
 *
 *  1. Every ~60s, a random colleague posts a new message in a random
 *     channel. Content rotates from a canned set so the feed grows
 *     without being repetitive.
 *
 *  2. Whenever the local user (id = "u:you") posts a message, the
 *     "other party" in that channel auto-responds 4–9 seconds later,
 *     like a real conversation partner.
 *
 *  3. Every ~4 minutes a brand new channel spins up to demonstrate
 *     the create-channel flow organically.
 *
 * The loop is installed once per tab from AppShell; subsequent
 * installations are no-ops (`installed` guard).
 */

let installed = false;
let channelInterval: ReturnType<typeof setInterval> | null = null;
let newChannelInterval: ReturnType<typeof setInterval> | null = null;
let unsubscribe: (() => void) | null = null;

const COLLEAGUE_POSTS = [
  'Quick heads up — the deploy just finished, everything green.',
  'Anyone free for a 10-minute sync later?',
  'I pushed a revised spec to the Notion doc, takes about 2 min to read.',
  'Update from legal — we are cleared on the new vendor.',
  'The onboarding numbers from last week are in, up 12%.',
  'Can someone take a look at PR #842 when they have a sec?',
  'FYI — I moved tomorrow standup to 10am.',
  'Reminder: Q2 planning meeting in 30 minutes.',
  "I'll be OOO Thursday afternoon for a dentist appointment.",
  'Nice work on the launch yesterday 👏',
];

const AUTO_REPLIES = [
  'Got it, thanks for letting me know.',
  'Sounds good — I’ll take a look shortly.',
  'Perfect, that works for me.',
  'Great, appreciate the update.',
  'Will follow up with the team.',
  'On it. Back to you in a bit.',
  'Makes sense — will adjust accordingly.',
];

const NEW_CHANNEL_TEMPLATES = [
  {
    name: 'product-launch',
    description: 'Coordinating the next product launch.',
  },
  { name: 'customer-wins', description: 'Share wins and feedback from customers.' },
  { name: 'random', description: 'Off-topic, memes, and watercooler chat.' },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getCandidateChannels(): Channel[] {
  const state = useNodeStore.getState();
  return Object.values(state.channelsById);
}

function postRandomMessage() {
  const channels = getCandidateChannels();
  if (channels.length === 0) return;
  const channel = pick(channels);
  const members = channel.memberIds.filter((id) => id !== 'u:you');
  if (members.length === 0) return;
  const authorId = pick(members);
  const text = pick(COLLEAGUE_POSTS);
  const state = useNodeStore.getState();
  const person = state.peopleById[authorId];
  const name = person?.name ?? authorId.replace(/^u:/, '').replace(/^\w/, (c) => c.toUpperCase());

  const message: Message = {
    id: `auto:${Date.now()}`,
    source: 'node-channel',
    channelId: channel.id,
    author: { id: authorId, name, kind: 'human' },
    createdAt: new Date().toISOString(),
    blocks: [{ type: 'text', content: text }],
    rawText: text,
    ai: { priority: 'fyi' },
  };
  dispatch({ kind: 'message.created', message });
}

function spawnNewChannel() {
  const state = useNodeStore.getState();
  const existing = Object.values(state.channelsById).map((c) => c.name);
  const available = NEW_CHANNEL_TEMPLATES.filter(
    (t) => !existing.includes(t.name),
  );
  if (available.length === 0) return;
  const template = pick(available);
  const channel: Channel = {
    id: `ch:${template.name}-${Date.now()}`,
    kind: 'channel',
    name: template.name,
    workspace: 'work',
    description: template.description,
    memberIds: ['u:you', 'u:alex', 'u:sam', 'u:mia'],
    lastMessageAt: new Date().toISOString(),
  };
  state.upsertChannel(channel);

  // Kick off the channel with a welcome from Alex.
  const welcome: Message = {
    id: `auto:welcome-${Date.now()}`,
    source: 'node-channel',
    channelId: channel.id,
    author: { id: 'u:alex', name: 'Alex Chen', kind: 'human' },
    createdAt: new Date().toISOString(),
    blocks: [
      {
        type: 'text',
        content: `Just spun up #${template.name} — ${template.description}`,
      },
    ],
    rawText: `Just spun up #${template.name}.`,
    ai: { priority: 'fyi' },
  };
  dispatch({ kind: 'message.created', message: welcome });
}

function installAutoReplyListener() {
  unsubscribe = subscribe((event) => {
    if (event.kind !== 'message.created') return;
    const msg = event.message;
    // Only respond to locally-authored messages that are NOT auto
    // generated themselves.
    if (msg.author.id !== 'u:you') return;
    if (msg.id.startsWith('auto:')) return;
    if (msg.rawText.startsWith('/')) return;

    const state = useNodeStore.getState();
    const channel = state.channelsById[msg.channelId];
    if (!channel) return;
    const others = channel.memberIds.filter((id) => id !== 'u:you');
    if (others.length === 0) return;
    const responderId = pick(others);
    const person = state.peopleById[responderId];
    const responderName =
      person?.name ??
      responderId.replace(/^u:|^wa:/, '').replace(/^\w/, (c) => c.toUpperCase());

    const delay = 4_000 + Math.random() * 5_000;
    const replyText = pick(AUTO_REPLIES);
    setTimeout(() => {
      const reply: Message = {
        id: `auto:reply-${Date.now()}`,
        source: channel.kind === 'whatsapp-chat' ? 'whatsapp' : 'node-channel',
        channelId: channel.id,
        threadId: msg.threadId,
        replyTo: {
          messageId: msg.id,
          authorName: 'You',
          preview: msg.rawText.slice(0, 120),
        },
        author: { id: responderId, name: responderName, kind: 'human' },
        createdAt: new Date().toISOString(),
        blocks: [{ type: 'text', content: replyText }],
        rawText: replyText,
        ai: { priority: 'fyi' },
      };
      dispatch({ kind: 'message.created', message: reply });
    }, delay);
  });
}

export function installAutoDemo(): void {
  if (installed) return;
  installed = true;

  installAutoReplyListener();

  // Every 60s, someone posts in a channel.
  channelInterval = setInterval(() => {
    postRandomMessage();
  }, 60_000);

  // Every 4 minutes, a new channel is created.
  newChannelInterval = setInterval(() => {
    spawnNewChannel();
  }, 4 * 60_000);
}

export function uninstallAutoDemo(): void {
  installed = false;
  if (channelInterval) {
    clearInterval(channelInterval);
    channelInterval = null;
  }
  if (newChannelInterval) {
    clearInterval(newChannelInterval);
    newChannelInterval = null;
  }
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
