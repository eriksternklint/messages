import { IconLayers } from '@/components/icons';
import type { MessageBlock } from '@/types';

type Block = Extract<MessageBlock, { type: 'notion-gallery' }>;

/**
 * Gallery view of a Notion database — rendered as a compact tile
 * strip in the chat bubble. Cover falls back to the initial of the
 * title on a zen-surface tile so the layout stays uniform even when
 * images aren't loaded yet.
 */
export function NotionGalleryBlock({ block }: { block: Block }) {
  return (
    <div className="rounded-md border border-zen-border bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zen-border bg-zen-surface">
        <IconLayers className="h-3 w-3 text-zen-muted" />
        <span className="text-[10px] uppercase tracking-wider text-zen-subtle">
          Notion gallery · {block.items.length} items
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 p-2">
        {block.items.map((item) => (
          <div
            key={item.id}
            className="rounded-md border border-zen-border overflow-hidden hover:shadow-sm transition-shadow cursor-pointer"
          >
            <div
              className="h-16 bg-zen-surface flex items-center justify-center text-[18px] font-medium text-zen-muted"
              style={
                item.cover
                  ? {
                      backgroundImage: `url(${item.cover})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              {!item.cover && item.title.charAt(0).toUpperCase()}
            </div>
            <div className="px-2 py-1.5 text-[11px] text-zen-ink truncate">
              {item.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
