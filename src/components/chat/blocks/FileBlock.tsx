import { IconArchive } from '@/components/icons';
import type { MessageBlock } from '@/types';

type Block = Extract<MessageBlock, { type: 'file' }>;

/**
 * File attachment chip. Mime-type is shown as the secondary caption so
 * the reader can tell a PDF from a zip without clicking.
 */
export function FileBlock({ block }: { block: Block }) {
  return (
    <a
      href={block.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2.5 px-3 py-2 rounded-md border border-zen-border bg-zen-surface hover:bg-white transition-colors max-w-full group"
    >
      <div className="h-8 w-8 rounded bg-white border border-zen-border flex items-center justify-center flex-shrink-0">
        <IconArchive className="h-3.5 w-3.5 text-zen-muted" />
      </div>
      <div className="min-w-0">
        <div className="text-[12.5px] text-zen-ink truncate group-hover:underline">
          {block.name}
        </div>
        <div className="text-[10px] text-zen-subtle">{block.mime}</div>
      </div>
    </a>
  );
}
