import type { StateCreator } from 'zustand';

import type { Channel, Message, WorkspaceMode } from '@/types';

export interface WorkspaceSlice {
  /** Current workspace mode — toggled from the sidebar switcher. */
  mode: WorkspaceMode;
  channelsById: Record<string, Channel>;
  activeChannelId?: string;

  setMode: (mode: WorkspaceMode) => void;
  upsertChannel: (channel: Channel) => void;
  setActiveChannel: (id: string) => void;
}

export const workspaceSlice: StateCreator<WorkspaceSlice, [], [], WorkspaceSlice> = (set) => ({
  mode: 'combined',
  channelsById: {},
  activeChannelId: undefined,

  setMode: (mode) => set({ mode }),

  upsertChannel: (channel) =>
    set((state) => ({
      channelsById: { ...state.channelsById, [channel.id]: channel },
    })),

  setActiveChannel: (id) => {
    // Opening a channel clears its unread flags — matches the Slack
    // behaviour where the badge disappears the instant you click in.
    // The slice-level `set` is typed to `Partial<WorkspaceSlice>` but
    // we're running inside a single combined store, so this cast to
    // the root-store shape is safe at runtime.
    const globalSet = set as unknown as (
      updater: (state: {
        messagesById?: Record<string, Message>;
        messageIdsByChannel?: Record<string, string[]>;
        activeChannelId?: string;
      }) => Partial<{
        messagesById: Record<string, Message>;
        activeChannelId: string;
      }>,
    ) => void;

    globalSet((state) => {
      const ids = state.messageIdsByChannel?.[id] ?? [];
      if (!state.messagesById || ids.length === 0) {
        return { activeChannelId: id };
      }
      let dirty = false;
      const next = { ...state.messagesById };
      for (const mid of ids) {
        const msg = next[mid];
        if (msg?.unread) {
          next[mid] = { ...msg, unread: false };
          dirty = true;
        }
      }
      return dirty
        ? { activeChannelId: id, messagesById: next }
        : { activeChannelId: id };
    });
  },
});
