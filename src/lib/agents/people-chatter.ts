import { dispatch, subscribe } from '@/lib/events';
import { useNodeStore } from '@/store';
import type { Channel, Message, Person } from '@/types';

/**
 * People Chatter — the louder, more "alive" cousin of auto-demo. Picks
 * random people from the org directory and has them either:
 *
 *  1. Send you a DM out of the blue ("hey, got a sec?")
 *  2. Post in an existing channel they're a member of
 *  3. Spin up a brand new channel and invite you in
 *  4. Auto-respond when you message them in a DM
 *
 * Runs every ~90s by default — close enough to "1 per 2 minutes" the
 * user asked for, with jitter so it doesn't feel mechanical.
 */

let installed = false;
let chatterInterval: ReturnType<typeof setInterval> | null = null;
let unsubscribe: (() => void) | null = null;

const DM_OPENERS = [
  'hey, got a sec?',
  'random q — do you know who owns the new onboarding flow?',
  'just sent you the doc, lmk what you think',
  'we still on for tomorrow?',
  'btw I loved your take in the all-hands',
  'hey can you sanity check this for me?',
  'stuck on a thing — mind a quick zoom later?',
  'brainstorm with me on the q3 thing?',
  'are you OOO this week or did I miss a memo',
  'fyi — finance just approved the budget bump',
];

const CHANNEL_POSTS = [
  'pushing a draft up in 10, would love eyes',
  'anyone seen the staging logs in the last hour?',
  'fixed the flake — going to land it after lunch',
  'reminder: design review at 3pm today',
  'numbers from yesterday are already trending up 6%',
  'just wrote a thing on this if it helps: <link>',
  'small ask — can we re-baseline the launch ticket',
  'looks like the customer call moved to thursday',
  'shipping the migration tonight, ping me if anything looks off',
  'fyi — running 5 min late to standup',
];

const REPLIES = [
  'oh interesting — let me think on this',
  'yes! just what I was hoping for',
  'mmm I have concerns about the timeline tho',
  'great point. updating the doc now.',
  'lol same',
  'yeah I can take this one',
  'send me the link?',
  '+1 from me',
  'omg perfect timing, was just about to ask',
  'ty for the heads up',
];

const AGENT_CHANNEL_TOPICS = [
  { name: 'launch-prep', desc: 'Prep work for the next launch.' },
  { name: 'eng-quality', desc: 'Quality, tests, regression triage.' },
  { name: 'design-crit', desc: 'Weekly design crits and feedback.' },
  { name: 'growth-experiments', desc: 'Active growth experiments.' },
  { name: 'customer-feedback', desc: 'Verbatim customer quotes.' },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatedPeople(): Person[] {
  const state = useNodeStore.getState();
  return Object.values(state.peopleById).filter((p) =>
    p.id.startsWith('u:p'),
  );
}

function existingDM(personId: string): Channel | undefined {
  const state = useNodeStore.getState();
  return Object.values(state.channelsById).find(
    (c) =>
      c.kind === 'dm' &&
      c.memberIds.length === 2 &&
      c.memberIds.includes('u:you') &&
      c.memberIds.includes(personId),
  );
}

function ensureDM(person: Person): Channel {
  const existing = existingDM(person.id);
  if (existing) return existing;
  const channel: Channel = {
    id: `dm:${person.id}`,
    kind: 'dm',
    name: person.name,
    workspace: 'work',
    memberIds: ['u:you', person.id],
    lastMessageAt: new Date().toISOString(),
  };
  useNodeStore.getState().upsertChannel(channel);
  return channel;
}

function dispatchMessage(
  channel: Channel,
  author: Person | { id: string; name: string },
  text: string,
): void {
  const message: Message = {
    id: `chatter:${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    source: 'node-channel',
    channelId: channel.id,
    author: { id: author.id, name: author.name, kind: 'human' },
    createdAt: new Date().toISOString(),
    blocks: [{ type: 'text', content: text }],
    rawText: text,
    ai: { priority: 'fyi' },
  };
  dispatch({ kind: 'message.created', message });
}

/** Send the user a fresh DM from a random colleague. */
function fireRandomDM(): void {
  const people = generatedPeople();
  if (people.length === 0) return;
  const p = pick(people);
  const channel = ensureDM(p);
  dispatchMessage(channel, p, pick(DM_OPENERS));
}

/** Post in an existing channel as a random member. */
function fireRandomChannelPost(): void {
  const state = useNodeStore.getState();
  const channels = Object.values(state.channelsById).filter(
    (c) => c.kind === 'channel' || c.kind === 'notion-mirror',
  );
  if (channels.length === 0) return;
  const channel = pick(channels);
  const candidateIds = channel.memberIds.filter((id) => id !== 'u:you');
  if (candidateIds.length === 0) {
    // Pull a random org member into the channel and have them post.
    const org = generatedPeople();
    if (org.length === 0) return;
    const newcomer = pick(org);
    const updated: Channel = {
      ...channel,
      memberIds: [...channel.memberIds, newcomer.id],
    };
    state.upsertChannel(updated);
    dispatchMessage(updated, newcomer, pick(CHANNEL_POSTS));
    return;
  }
  const personId = pick(candidateIds);
  const author = state.peopleById[personId];
  if (!author) return;
  dispatchMessage(channel, author, pick(CHANNEL_POSTS));
}

/** Spin up a new channel and invite the user. */
function fireNewChannel(): void {
  const state = useNodeStore.getState();
  const existingNames = new Set(
    Object.values(state.channelsById).map((c) => c.name),
  );
  const available = AGENT_CHANNEL_TOPICS.filter(
    (t) => !existingNames.has(t.name),
  );
  if (available.length === 0) return;
  const topic = pick(available);
  const org = generatedPeople();
  if (org.length === 0) return;
  // Invite 4–6 members, plus you.
  const memberCount = 4 + Math.floor(Math.random() * 3);
  const invited = new Set<string>();
  while (invited.size < memberCount && invited.size < org.length) {
    invited.add(pick(org).id);
  }
  const channel: Channel = {
    id: `ch:${topic.name}-${Date.now()}`,
    kind: 'channel',
    name: topic.name,
    workspace: 'work',
    description: topic.desc,
    memberIds: ['u:you', ...Array.from(invited)],
    lastMessageAt: new Date().toISOString(),
  };
  state.upsertChannel(channel);
  const founderId = Array.from(invited)[0];
  const founder = state.peopleById[founderId];
  if (founder) {
    dispatchMessage(
      channel,
      founder,
      `started #${topic.name} — ${topic.desc} added you in case you want to follow along`,
    );
  }
}

/** Reply to an outbound DM/channel message from the user. */
function installReplyListener(): void {
  unsubscribe = subscribe((event) => {
    if (event.kind !== 'message.created') return;
    const msg = event.message;
    if (msg.author.id !== 'u:you') return;
    if (msg.id.startsWith('chatter:')) return;
    if (msg.id.startsWith('auto:')) return;
    if (msg.rawText.startsWith('/')) return;

    const state = useNodeStore.getState();
    const channel = state.channelsById[msg.channelId];
    if (!channel) return;
    const others = channel.memberIds.filter((id) => id !== 'u:you');
    if (others.length === 0) return;
    const responderId = pick(others);
    const responder = state.peopleById[responderId];
    if (!responder) return;

    const delay = 3_000 + Math.random() * 7_000;
    setTimeout(() => {
      dispatchMessage(channel, responder, pick(REPLIES));
    }, delay);
  });
}

/** Tick — pick one of the three behaviours and fire it. */
function tick(): void {
  const roll = Math.random();
  if (roll < 0.55) fireRandomDM();
  else if (roll < 0.92) fireRandomChannelPost();
  else fireNewChannel();
}

export function installPeopleChatter(): void {
  if (installed) return;
  installed = true;
  installReplyListener();
  // First fire after ~20s so the dashboard isn't empty on load.
  setTimeout(tick, 20_000);
  chatterInterval = setInterval(tick, 90_000 + Math.random() * 30_000);
}

export function uninstallPeopleChatter(): void {
  installed = false;
  if (chatterInterval) {
    clearInterval(chatterInterval);
    chatterInterval = null;
  }
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
