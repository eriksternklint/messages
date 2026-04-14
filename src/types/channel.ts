import type { WorkspaceMode } from './source';

export interface PinnedLink {
  id: string;
  label: string;
  url: string;
  kind: 'notion' | 'drive' | 'web' | 'figma';
}

/** A Notion database linked into a channel — shown in chat settings. */
export interface LinkedNotionTable {
  id: string;
  title: string;
  url: string;
  /** Human-readable purpose — "Roadmap", "Tasks", "CRM" — rendered as a badge. */
  role?: string;
}

/**
 * A conversational surface. Channels are not "just chat rooms" —
 * a `notion-mirror` channel is backed by a live Notion page, and a
 * `whatsapp-chat` channel is backed by an inbound DMA third-party chat.
 */
export interface Channel {
  id: string;
  kind: 'channel' | 'dm' | 'notion-mirror' | 'whatsapp-chat';
  name: string;
  workspace: WorkspaceMode;
  description?: string;
  /** For notion-mirror channels — the backing Notion page id. */
  notionPageId?: string;
  /** For whatsapp-chat channels — the external chat id. */
  whatsappChatId?: string;
  memberIds: string[];
  agentIds?: string[];
  lastMessageAt?: string;
  /**
   * Not rendered as a red dot — sorted into the Priority Feed instead.
   * Present only for the channel list ordering.
   */
  unreadCount?: number;
  /** Pinned resource bar at the top of the channel (Notion docs, etc). */
  pinnedLinks?: PinnedLink[];
  /** Marked as a favourite — surfaces in the Home view "Starred" section. */
  starred?: boolean;
  /** Private channels only show for explicit members. */
  isPrivate?: boolean;
  /** Notion databases linked to this channel — shown in chat settings. */
  linkedNotionTables?: LinkedNotionTable[];
}
