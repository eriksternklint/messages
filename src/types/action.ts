import type { PriorityBucket, SourceKind } from './source';

/**
 * An item in the Global Task Sidebar. Acts as a live 2-way mirror of a
 * master Notion Task Database: every ActionItem with a `notionTaskId`
 * is expected to stay in sync via the Notion webhook layer.
 *
 * "Remind me later" on any message creates one of these.
 */
export interface ActionItem {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'waiting' | 'done' | 'snoozed';
  /** When the item is due or should resurface in the Priority Feed. */
  dueAt?: string;
  /** If surfaced from a specific message — used for "Remind me later". */
  createdFrom?: {
    messageId: string;
    source: SourceKind;
  };
  /** Mirror reference to the Notion task database row. */
  notionTaskId?: string;
  assigneeId?: string;
  priority: PriorityBucket;
  createdAt: string;
  updatedAt: string;
}
