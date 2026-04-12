import type { PriorityBucket, SourceKind } from './source';

/** Who or what produced a message. */
export interface Author {
  id: string;
  name: string;
  avatarUrl?: string;
  kind: 'human' | 'agent' | 'system';
  /** For agent authors, e.g. "Project Manager" or "Lifestyle Assistant". */
  agentPersona?: string;
}

/**
 * Block-level content. A message is not a single string — it is an
 * ordered list of blocks. Some blocks are plain text; others are
 * interactive Notion references that render as live React components
 * inside the chat bubble.
 */
export type MessageBlock =
  | { type: 'text'; content: string }
  | { type: 'markdown'; content: string }
  | { type: 'notion-page-ref'; pageId: string; title: string; url: string }
  | {
      type: 'notion-block';
      blockId: string;
      blockType: string;
      data: unknown;
    }
  | {
      type: 'notion-table';
      tableId: string;
      columns: string[];
      rows: Array<Record<string, string>>;
    }
  | {
      type: 'notion-gallery';
      galleryId: string;
      items: Array<{ id: string; title: string; cover?: string }>;
    }
  | {
      type: 'action-card';
      title: string;
      description?: string;
      actions: Array<{ id: string; label: string; command?: string }>;
    }
  | { type: 'file'; name: string; url: string; mime: string };

/** AI-layer enrichment attached by the Orchestration Layer. */
export interface MessageAIMeta {
  priority: PriorityBucket;
  /** Tags extracted by NLP intent analysis ("commitment", "question", etc). */
  intentTags?: string[];
  /** Ghost Tracking: "I'll get back to you Friday" -> Friday ISO date. */
  deferUntil?: string;
  /** Pre-filled response drafted by the RAG layer. */
  draftedResponse?: string;
  /** Which knowledge sources were used to draft the response. */
  contextSources?: string[];
  /** 0..1 confidence score. */
  confidence?: number;
}

/**
 * The normalized message type. Every source — Notion comment, WhatsApp
 * inbound, Slack-style channel post, agent webhook — is mapped into this
 * shape before it reaches the store or the UI.
 */
export interface Message {
  id: string;
  source: SourceKind;
  /** Reference back to the external system for round-trip sync. */
  sourceRef?: {
    externalId: string;
    externalUrl?: string;
  };
  channelId: string;
  /** If this is a thread reply, the parent message id. */
  threadId?: string;
  author: Author;
  createdAt: string;
  editedAt?: string;
  blocks: MessageBlock[];
  /** Flattened text (derived from blocks) for search and NLP. */
  rawText: string;
  reactions?: Array<{ emoji: string; userIds: string[] }>;
  ai?: MessageAIMeta;
}
