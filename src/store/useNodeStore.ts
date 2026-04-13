import { create } from 'zustand';

import type { InboundEvent } from '@/types';

import { actionsSlice, type ActionsSlice } from './slices/actionsSlice';
import { agentsSlice, type AgentsSlice } from './slices/agentsSlice';
import { messagesSlice, type MessagesSlice } from './slices/messagesSlice';
import { peopleSlice, type PeopleSlice } from './slices/peopleSlice';
import { priorityFeedSlice, type PriorityFeedSlice } from './slices/priorityFeedSlice';
import { uiSlice, type UISlice } from './slices/uiSlice';
import { workspaceSlice, type WorkspaceSlice } from './slices/workspaceSlice';

/**
 * The root store. Every slice is combined here, plus a single
 * `applyEvent` reducer that is the ONLY way raw inbound events are
 * allowed to mutate state. This keeps the data flow unidirectional:
 *
 *   source webhook/socket
 *     -> normalizer (src/lib/events/sources/*)
 *       -> dispatch(event) (src/lib/events/bus)
 *         -> store.applyEvent(event)
 *           -> slice mutations
 *             -> React re-renders
 */
export type NodeStore = MessagesSlice &
  ActionsSlice &
  WorkspaceSlice &
  AgentsSlice &
  PriorityFeedSlice &
  PeopleSlice &
  UISlice & {
    applyEvent: (event: InboundEvent) => void;
  };

export const useNodeStore = create<NodeStore>()((set, get, store) => ({
  ...messagesSlice(set, get, store),
  ...actionsSlice(set, get, store),
  ...workspaceSlice(set, get, store),
  ...agentsSlice(set, get, store),
  ...priorityFeedSlice(set, get, store),
  ...peopleSlice(set, get, store),
  ...uiSlice(set, get, store),

  applyEvent: (event) => {
    switch (event.kind) {
      case 'message.created':
        get().ingestMessage(event.message);
        return;

      case 'notion.comment.created':
        get().ingestMessage(event.comment);
        return;

      case 'whatsapp.inbound':
        get().ingestMessage(event.message);
        return;

      case 'agent.push':
        get().ingestMessage(event.message);
        return;

      case 'message.updated':
        get().updateMessage(event.message);
        return;

      case 'message.deleted':
        get().deleteMessage(event.id);
        return;

      case 'notion.block.updated':
        get().refreshNotionBlock(event.pageId, event.blockId, event.data);
        return;

      case 'action.created':
        get().addAction(event.item);
        return;

      case 'action.updated':
        get().updateAction(event.item);
        return;
    }
  },
}));
