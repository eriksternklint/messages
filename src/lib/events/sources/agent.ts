import type { InboundEvent, Message, MessageBlock } from '@/types';

/**
 * Autonomous agents push updates into Node via a webhook. A push can
 * be a simple text washup or a structured block array (for example, a
 * weekly report rendered as a Notion-style table).
 */
export interface AgentPushPayload {
  agentId: string;
  agentName: string;
  agentPersona?: string;
  channelId: string;
  messageId: string;
  timestamp: string;
  text: string;
  /** Optional pre-structured blocks. Overrides the text-only rendering. */
  blocks?: MessageBlock[];
}

export function normalizeAgentPush(payload: AgentPushPayload): InboundEvent {
  const blocks: MessageBlock[] = payload.blocks ?? [
    { type: 'markdown', content: payload.text },
  ];

  const message: Message = {
    id: `agent:${payload.messageId}`,
    source: 'agent',
    sourceRef: { externalId: payload.messageId },
    channelId: payload.channelId,
    author: {
      id: payload.agentId,
      name: payload.agentName,
      kind: 'agent',
      agentPersona: payload.agentPersona,
    },
    createdAt: payload.timestamp,
    blocks,
    rawText: payload.text,
  };

  return {
    kind: 'agent.push',
    agentId: payload.agentId,
    channelId: payload.channelId,
    message,
  };
}
