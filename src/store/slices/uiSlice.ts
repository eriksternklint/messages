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
  /**
   * The AI Agent panel lives in the right sidebar — toggled from the
   * top bar. When open, it replaces thread-context mode in the sidebar.
   */
  aiAgentOpen: boolean;
  /** AI-powered search palette (Cmd+K). */
  searchOpen: boolean;
  /** Floating create dialog — single slot. */
  createModal: CreateModalKind;
  /** Start-chat omni modal — new top-of-sidebar entry point. */
  startChatOpen: boolean;
  /** Org Directory floating panel — triggered from top-bar people button. */
  orgDirectoryOpen: boolean;
  /** Thread sidepanel — holds the parent message id. */
  openThreadId: string | null;
  /** Pending inline quote reply — holds the quoted message id. */
  quoteMessageId: string | null;
  /** Channel header extra tab — 'files' | 'members' | 'settings' | null. */
  channelTab: 'files' | 'members' | 'settings' | null;

  setView: (view: ViewMode) => void;
  toggleWorkspacePanel: () => void;
  setWorkspacePanelOpen: (open: boolean) => void;
  toggleAIAgent: () => void;
  setAIAgentOpen: (open: boolean) => void;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  openCreateModal: (kind: Exclude<CreateModalKind, null>) => void;
  closeCreateModal: () => void;
  setStartChatOpen: (open: boolean) => void;
  setOrgDirectoryOpen: (open: boolean) => void;
  openThread: (messageId: string) => void;
  closeThread: () => void;
  setQuote: (messageId: string | null) => void;
  setChannelTab: (tab: UISlice['channelTab']) => void;
}

export const uiSlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  view: 'home',
  workspacePanelOpen: false,
  aiAgentOpen: false,
  searchOpen: false,
  createModal: null,
  startChatOpen: false,
  orgDirectoryOpen: false,
  openThreadId: null,
  quoteMessageId: null,
  channelTab: null,

  setView: (view) => set({ view }),
  toggleWorkspacePanel: () =>
    set((s) => ({ workspacePanelOpen: !s.workspacePanelOpen })),
  setWorkspacePanelOpen: (workspacePanelOpen) => set({ workspacePanelOpen }),
  toggleAIAgent: () =>
    set((s) => ({
      aiAgentOpen: !s.aiAgentOpen,
      // Opening the AI Agent auto-closes any open thread — only one
      // mode lives in the right sidebar at a time.
      openThreadId: !s.aiAgentOpen ? null : s.openThreadId,
    })),
  setAIAgentOpen: (aiAgentOpen) => set({ aiAgentOpen }),
  toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  openCreateModal: (kind) => set({ createModal: kind }),
  closeCreateModal: () => set({ createModal: null }),
  setStartChatOpen: (startChatOpen) => set({ startChatOpen }),
  setOrgDirectoryOpen: (orgDirectoryOpen) => set({ orgDirectoryOpen }),
  openThread: (messageId) =>
    set({ openThreadId: messageId, aiAgentOpen: false }),
  closeThread: () => set({ openThreadId: null }),
  setQuote: (messageId) => set({ quoteMessageId: messageId }),
  setChannelTab: (channelTab) => set({ channelTab }),
});
