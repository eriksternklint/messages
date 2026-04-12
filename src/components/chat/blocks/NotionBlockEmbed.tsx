import type { MessageBlock } from '@/types';

type Block = Extract<MessageBlock, { type: 'notion-block' }>;

/**
 * Catch-all for arbitrary Notion blocks (callout, quote, heading).
 * The `data` shape is source-specific; we try common fields and fall
 * back to a stringified preview. A proper mapper-per-blockType lives
 * in a later step once real Notion sync is wired.
 */
export function NotionBlockEmbed({ block }: { block: Block }) {
  const data = block.data as
    | { text?: string; title?: string; emoji?: string }
    | undefined;
  const preview =
    data?.text ?? data?.title ?? JSON.stringify(block.data).slice(0, 160);

  return (
    <div className="border-l-2 border-zen-border pl-3 py-1 text-[13px] text-zen-muted">
      {data?.emoji && <span className="mr-1.5">{data.emoji}</span>}
      <span className="text-zen-ink">{preview}</span>
      <div className="text-[10px] text-zen-subtle mt-1 uppercase tracking-wider">
        notion · {block.blockType}
      </div>
    </div>
  );
}
