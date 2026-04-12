import { IconPage } from '@/components/icons';
import type { MessageBlock } from '@/types';

type Block = Extract<MessageBlock, { type: 'notion-page-ref' }>;

/**
 * An inline card linking a Notion page. Distinct from a raw URL in
 * that we render the page title + a subtle "Notion" badge, matching
 * the way Notion itself previews linked pages.
 */
export function NotionPageRefBlock({ block }: { block: Block }) {
  return (
    <a
      href={block.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-zen-border bg-zen-surface hover:bg-white transition-colors max-w-full group"
    >
      <IconPage className="h-3.5 w-3.5 text-zen-muted flex-shrink-0" />
      <span className="text-[12.5px] text-zen-ink truncate group-hover:underline">
        {block.title}
      </span>
      <span className="text-[10px] text-zen-subtle flex-shrink-0 border-l border-zen-border pl-2">
        Notion
      </span>
    </a>
  );
}
