import type { InboundEvent, Message } from '@/types';

/**
 * Raw Notion webhook payload (loose typing — we only read a few fields).
 * Real Notion webhooks ship `type`, `page_id`, and a discriminated
 * object whose shape depends on `type`.
 */
export interface NotionWebhookPayload {
  type: 'comment.created' | 'page.updated' | 'block.updated';
  page_id?: string;
  block_id?: string;
  comment?: {
    id: string;
    created_time: string;
    created_by: { id: string; name?: string };
    rich_text: Array<{ plain_text: string }>;
  };
  block?: {
    id: string;
    type: string;
    [key: string]: unknown;
  };
}

/**
 * Convert a raw Notion webhook payload into a normalized InboundEvent.
 * Returns `null` for payloads we don't yet handle.
 */
export function normalizeNotion(payload: NotionWebhookPayload): InboundEvent | null {
  if (payload.type === 'comment.created' && payload.comment && payload.page_id) {
    const text = payload.comment.rich_text.map((t) => t.plain_text).join('');
    const message: Message = {
      id: `notion:${payload.comment.id}`,
      source: 'notion',
      sourceRef: { externalId: payload.comment.id },
      channelId: `notion-page:${payload.page_id}`,
      author: {
        id: payload.comment.created_by.id,
        name: payload.comment.created_by.name ?? 'Notion user',
        kind: 'human',
      },
      createdAt: payload.comment.created_time,
      blocks: [{ type: 'text', content: text }],
      rawText: text,
    };
    return {
      kind: 'notion.comment.created',
      pageId: payload.page_id,
      comment: message,
    };
  }

  if (payload.type === 'block.updated' && payload.block && payload.page_id) {
    return {
      kind: 'notion.block.updated',
      pageId: payload.page_id,
      blockId: payload.block.id,
      data: payload.block,
    };
  }

  return null;
}
