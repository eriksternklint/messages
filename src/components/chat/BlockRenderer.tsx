import type { MessageBlock } from '@/types';

import { ActionCardBlock } from './blocks/ActionCardBlock';
import { FileBlock } from './blocks/FileBlock';
import { MarkdownBlock } from './blocks/MarkdownBlock';
import { NotionBlockEmbed } from './blocks/NotionBlockEmbed';
import { NotionGalleryBlock } from './blocks/NotionGalleryBlock';
import { NotionPageRefBlock } from './blocks/NotionPageRefBlock';
import { NotionTableBlock } from './blocks/NotionTableBlock';
import { TextBlock } from './blocks/TextBlock';

/**
 * Dispatches a `MessageBlock` to the right renderer. Every block type
 * in the union must be handled here — TypeScript's exhaustiveness
 * check via the `never` fallthrough will catch any new block type
 * added to the union that forgets a renderer.
 */
export function BlockRenderer({ block }: { block: MessageBlock }) {
  switch (block.type) {
    case 'text':
      return <TextBlock block={block} />;
    case 'markdown':
      return <MarkdownBlock block={block} />;
    case 'notion-page-ref':
      return <NotionPageRefBlock block={block} />;
    case 'notion-block':
      return <NotionBlockEmbed block={block} />;
    case 'notion-table':
      return <NotionTableBlock block={block} />;
    case 'notion-gallery':
      return <NotionGalleryBlock block={block} />;
    case 'action-card':
      return <ActionCardBlock block={block} />;
    case 'file':
      return <FileBlock block={block} />;
    default: {
      // Exhaustiveness guard — if a new block type is added to the
      // union and not handled above, this assignment errors at build.
      const _never: never = block;
      return null;
    }
  }
}
