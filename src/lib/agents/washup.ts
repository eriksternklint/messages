import { dispatch } from '@/lib/events';
import { normalizeAgentPush } from '@/lib/events/sources/agent';
import { useNodeStore } from '@/store';

/**
 * Client-side helper that simulates a 24/7 cloud agent pushing a
 * proactive washup report into a channel.
 *
 * In production this flow is HTTP: the external agent POSTs to
 * `/api/agents/webhook`, the server validates and broadcasts to
 * connected clients (SSE/WebSocket). For the MVP demo we short-circuit
 * that round trip and dispatch directly into the local event bus,
 * which then fans out through the orchestrator exactly like a real
 * event would.
 */
export function triggerWashup(channelId: string, agentId = 'agent:pm'): void {
  const state = useNodeStore.getState();
  const channel = state.channelsById[channelId];
  if (!channel) return;

  const text = randomWashupText(channel.name);
  const event = normalizeAgentPush({
    agentId,
    agentName: 'PM Agent',
    agentPersona: 'Project Manager',
    channelId,
    messageId: `washup-${Date.now()}`,
    timestamp: new Date().toISOString(),
    text,
  });
  dispatch(event);
}

const PR_VERBS = ['merged', 'landed', 'shipped'];

function randomWashupText(channelName: string): string {
  const prs = 1 + Math.floor(Math.random() * 5);
  const reviews = Math.floor(Math.random() * 4);
  const blockers = Math.floor(Math.random() * 3);
  const verb = PR_VERBS[Math.floor(Math.random() * PR_VERBS.length)];
  const bits: string[] = [];
  bits.push(`${prs} PR${prs === 1 ? '' : 's'} ${verb}`);
  if (reviews > 0) {
    bits.push(`${reviews} open review${reviews === 1 ? '' : 's'}`);
  }
  if (blockers > 0) {
    bits.push(`${blockers} blocker${blockers === 1 ? '' : 's'}`);
  } else {
    bits.push('no blockers');
  }
  return `Daily washup for #${channelName} — ${bits.join(', ')}. Full report in Notion.`;
}
