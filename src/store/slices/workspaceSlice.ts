import type { StateCreator } from 'zustand';

import type { Channel, WorkspaceMode } from '@/types';

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

  setActiveChannel: (id) => set({ activeChannelId: id }),
});
