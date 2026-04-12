import type { WorkspaceMode } from './source';

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
}
