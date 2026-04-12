import { IconPage } from '@/components/icons';
import type { MessageBlock } from '@/types';

type Block = Extract<MessageBlock, { type: 'notion-table' }>;

/**
 * Live-mirrored Notion table. Renders inside a chat bubble but still
 * feels like a data grid — horizontal scroll, column headers, hover
 * rows. Each row is a link target in a future step (click → open
 * detail pane), for now just a visual element.
 */
export function NotionTableBlock({ block }: { block: Block }) {
  return (
    <div className="rounded-md border border-zen-border bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zen-border bg-zen-surface">
        <IconPage className="h-3 w-3 text-zen-muted" />
        <span className="text-[10px] uppercase tracking-wider text-zen-subtle">
          Notion table · {block.rows.length} rows
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-zen-border">
              {block.columns.map((col) => (
                <th
                  key={col}
                  className="text-left font-medium text-zen-muted px-3 py-2 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-zen-border last:border-0 hover:bg-zen-surface transition-colors"
              >
                {block.columns.map((col) => (
                  <td
                    key={col}
                    className="px-3 py-2 text-zen-ink whitespace-nowrap"
                  >
                    {row[col] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
