import type { MessageBlock } from '@/types';

type Block = Extract<MessageBlock, { type: 'text' }>;

/**
 * Plain-text block. The default renderer — no decoration, just the
 * text with preserved whitespace and relaxed line-height so long
 * paragraphs breathe.
 */
export function TextBlock({ block }: { block: Block }) {
  return (
    <div className="text-[13px] text-zen-ink whitespace-pre-wrap leading-relaxed">
      {block.content}
    </div>
  );
}
