import type { StateCreator } from 'zustand';

import type { Agent } from '@/types';

export interface AgentsSlice {
  agentsById: Record<string, Agent>;

  registerAgent: (agent: Agent) => void;
  removeAgent: (id: string) => void;
}

export const agentsSlice: StateCreator<AgentsSlice, [], [], AgentsSlice> = (set) => ({
  agentsById: {},

  registerAgent: (agent) =>
    set((state) => ({
      agentsById: { ...state.agentsById, [agent.id]: agent },
    })),

  removeAgent: (id) =>
    set((state) => {
      const rest = { ...state.agentsById };
      delete rest[id];
      return { agentsById: rest };
    }),
});
