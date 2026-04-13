import type { StateCreator } from 'zustand';

import type { ViewMode } from '@/types';

export type CreateModalKind =
  | 'new-person'
  | 'new-agent'
  | 'new-channel'
  | 'new-chat'
  | null;

/**
 * Pure UI state. Lives in the root store so any component can read
 * without prop drilling and so the auto-demo loop + keyboard shortcut
 * handlers can mutate UI state from outside React.
 */
export interface UISlice {
  /** The primary view selected in the left rail. */
  view: ViewMode;
  /** Workspace drawer opens from the top-left brand/avatar click. */
  workspacePanelOpen: boolean;
  /** Global AI chat (bottom-right floating panel). */
  aiPanelOpen: boolean;
  /** AI-powered search palette (Cmd+K). */
  searchOpen: boolean;
  /** Floating create dialog — single slot. */
  createModal: CreateModalKind;
  /** Thread sidepanel — holds the parent message id. */
  openThreadId: string | null;
  /** Pending inline quote reply — holds the quoted message id. */
  quoteMessageId: string | null;
  /** Channel header extra tab — 'files' | 'members' | null. */
  channelTab: 'files' | 'members' | 'settings' | null;

  setView: (view: ViewMode) => void;
  toggleWorkspacePanel: () => void;
  setWorkspacePanelOpen: (open: boolean) => void;
  toggleAIPanel: () => void;
  setAIPanelOpen: (open: boolean) => void;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  openCreateModal: (kind: Exclude<CreateModalKind, null>) => void;
  closeCreateModal: () => void;
  openThread: (messageId: string) => void;
  closeThread: () => void;
  setQuote: (messageId: string | null) => void;
  setChannelTab: (tab: UISlice['channelTab']) => void;
}

export const uiSlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  view: 'inbox',
  workspacePanelOpen: false,
  aiPanelOpen: false,
  searchOpen: false,
  createModal: null,
  openThreadId: null,
  quoteMessageId: null,
  channelTab: null,

  setView: (view) => set({ view }),
  toggleWorkspacePanel: () =>
    set((s) => ({ workspacePanelOpen: !s.workspacePanelOpen })),
  setWorkspacePanelOpen: (workspacePanelOpen) => set({ workspacePanelOpen }),
  toggleAIPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
  setAIPanelOpen: (aiPanelOpen) => set({ aiPanelOpen }),
  toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  openCreateModal: (kind) => set({ createModal: kind }),
  closeCreateModal: () => set({ createModal: null }),
  openThread: (messageId) => set({ openThreadId: messageId }),
  closeThread: () => set({ openThreadId: null }),
  setQuote: (messageId) => set({ quoteMessageId: messageId }),
  setChannelTab: (channelTab) => set({ channelTab }),
});
