import type { StateCreator } from 'zustand';

import type { ActionItem } from '@/types';

export interface ActionsSlice {
  actionsById: Record<string, ActionItem>;

  addAction: (item: ActionItem) => void;
  updateAction: (item: ActionItem) => void;
  removeAction: (id: string) => void;
}

export const actionsSlice: StateCreator<ActionsSlice, [], [], ActionsSlice> = (set) => ({
  actionsById: {},

  addAction: (item) =>
    set((state) => ({
      actionsById: { ...state.actionsById, [item.id]: item },
    })),

  updateAction: (item) =>
    set((state) => ({
      actionsById: { ...state.actionsById, [item.id]: item },
    })),

  removeAction: (id) =>
    set((state) => {
      const rest = { ...state.actionsById };
      delete rest[id];
      return { actionsById: rest };
    }),
});
