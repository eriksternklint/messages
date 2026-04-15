import type { StateCreator } from 'zustand';

import type { Message, PriorityBucket } from '@/types';

export interface MessagesSlice {
  messagesById: Record<string, Message>;
  /** Ordered message id lists, keyed by channelId. */
  messageIdsByChannel: Record<string, string[]>;

  ingestMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  deleteMessage: (id: string) => void;
  /** Mutate every message that embeds a given Notion block. */
  refreshNotionBlock: (pageId: string, blockId: string, data: unknown) => void;
  /** Set the AI-classified priority bucket for a message. */
  setPriority: (messageId: string, priority: PriorityBucket) => void;
}

export const messagesSlice: StateCreator<MessagesSlice, [], [], MessagesSlice> = (set) => ({
  messagesById: {},
  messageIdsByChannel: {},

  ingestMessage: (message) =>
    set((state) => {
      const existing = state.messagesById[message.id];
      const ids = state.messageIdsByChannel[message.channelId] ?? [];
      // Auto-mark new incoming human/agent messages as unread so the
      // sidebar badge logic has something to show, unless the user is
      // already looking at that channel. Respects any unread flag the
      // caller has explicitly set on the message.
      const shouldAutoUnread =
        !existing &&
        message.unread === undefined &&
        message.author.id !== 'u:you' &&
        message.author.kind !== 'system' &&
        // `activeChannelId` lives in the workspace slice on the same root
        // store — at this point `state` is the combined state so it's
        // readable here.
        ((state as unknown) as { activeChannelId?: string }).activeChannelId !==
          message.channelId;
      const normalized = shouldAutoUnread
        ? { ...message, unread: true }
        : message;
      const nextMessagesById = {
        ...state.messagesById,
        [message.id]: normalized,
      };

      // If this is a thread reply, bump the parent's reply count so
      // the "N replies" label under the parent stays fresh.
      if (message.threadId && !existing) {
        const parent = nextMessagesById[message.threadId];
        if (parent) {
          nextMessagesById[message.threadId] = {
            ...parent,
            threadReplyCount: (parent.threadReplyCount ?? 0) + 1,
          };
        }
      }

      return {
        messagesById: nextMessagesById,
        messageIdsByChannel: existing
          ? state.messageIdsByChannel
          : {
              ...state.messageIdsByChannel,
              [message.channelId]: [...ids, message.id],
            },
      };
    }),

  updateMessage: (message) =>
    set((state) => ({
      messagesById: { ...state.messagesById, [message.id]: message },
    })),

  deleteMessage: (id) =>
    set((state) => {
      const msg = state.messagesById[id];
      if (!msg) return state;
      const rest = { ...state.messagesById };
      delete rest[id];
      const channelIds = state.messageIdsByChannel[msg.channelId] ?? [];
      return {
        messagesById: rest,
        messageIdsByChannel: {
          ...state.messageIdsByChannel,
          [msg.channelId]: channelIds.filter((mid) => mid !== id),
        },
      };
    }),

  refreshNotionBlock: (_pageId, blockId, data) =>
    set((state) => {
      const updated = { ...state.messagesById };
      let changed = false;
      for (const id of Object.keys(updated)) {
        const msg = updated[id];
        const nextBlocks = msg.blocks.map((b) =>
          b.type === 'notion-block' && b.blockId === blockId ? { ...b, data } : b,
        );
        if (nextBlocks.some((b, i) => b !== msg.blocks[i])) {
          updated[id] = { ...msg, blocks: nextBlocks };
          changed = true;
        }
      }
      return changed ? { messagesById: updated } : state;
    }),

  setPriority: (messageId, priority) =>
    set((state) => {
      const msg = state.messagesById[messageId];
      if (!msg) return state;
      return {
        messagesById: {
          ...state.messagesById,
          [messageId]: {
            ...msg,
            ai: { ...(msg.ai ?? { priority }), priority },
          },
        },
      };
    }),
});
