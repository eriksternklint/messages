import type { ActionItem } from './action';
import type { Message } from './message';

/**
 * The single, normalized event type that every source funnels into.
 * The event bus dispatches these; the Zustand store's `applyEvent`
 * reducer is the only thing allowed to mutate state in response.
 *
 * Adding a new source = adding one or more event kinds here plus a
 * normalizer in `src/lib/events/sources/`.
 */
export type InboundEvent =
  | { kind: 'message.created'; message: Message }
  | { kind: 'message.updated'; message: Message }
  | { kind: 'message.deleted'; id: string }
  | {
      kind: 'notion.block.updated';
      pageId: string;
      blockId: string;
      data: unknown;
    }
  | { kind: 'notion.comment.created'; pageId: string; comment: Message }
  | { kind: 'whatsapp.inbound'; message: Message }
  | {
      kind: 'agent.push';
      agentId: string;
      channelId: string;
      message: Message;
    }
  | { kind: 'action.created'; item: ActionItem }
  | { kind: 'action.updated'; item: ActionItem };
