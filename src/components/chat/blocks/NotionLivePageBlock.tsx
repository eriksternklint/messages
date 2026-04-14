'use client';

import { useMemo, useState } from 'react';

import {
  IconCheck,
  IconPage,
  IconPlus,
  IconSparkle,
  IconTrash,
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { Message, MessageBlock, NotionLiveBlock } from '@/types';

type Block = Extract<MessageBlock, { type: 'notion-live-page' }>;

/**
 * The Notion-style live page block. A real, in-place editable subtree
 * — the user can click any block to edit its text, toggle todos, add
 * table rows, run the formula bar, and so on. Every mutation goes
 * through `updateMessage` so the change persists in the store and
 * re-renders for every viewer of this message.
 *
 * Agents mutate the same shape via the same store path, so the user
 * sees agent edits arrive live without any extra plumbing.
 */
export function NotionLivePageBlock({
  block,
  message,
}: {
  block: Block;
  message: Message;
}) {
  const updateMessage = useNodeStore((s) => s.updateMessage);

  function patch(updater: (b: Block) => Block) {
    const nextBlocks = message.blocks.map((b) =>
      b === block ? updater(block) : b,
    );
    updateMessage({
      ...message,
      blocks: nextBlocks,
      editedAt: new Date().toISOString(),
    });
  }

  function updateBlock(id: string, next: NotionLiveBlock) {
    patch((b) => ({
      ...b,
      blocks: b.blocks.map((nb) => (nb.id === id ? next : nb)),
    }));
  }

  function removeBlock(id: string) {
    patch((b) => ({
      ...b,
      blocks: b.blocks.filter((nb) => nb.id !== id),
    }));
  }

  function addBlock(after: string | null, kind: NotionLiveBlock['type']) {
    const newBlock: NotionLiveBlock = createBlank(kind);
    patch((b) => {
      const idx = after ? b.blocks.findIndex((nb) => nb.id === after) : -1;
      const next = [...b.blocks];
      next.splice(idx + 1, 0, newBlock);
      return { ...b, blocks: next };
    });
  }

  function updateTitle(title: string) {
    patch((b) => ({ ...b, title }));
  }

  return (
    <div className="rounded-lg border border-zen-border bg-white shadow-zen-soft overflow-hidden my-1">
      <div className="px-4 pt-3 pb-2 border-b border-zen-border bg-gradient-to-b from-white to-zen-canvas/40 flex items-center gap-2">
        <span className="text-[18px] leading-none">{block.icon ?? '📄'}</span>
        <input
          value={block.title}
          onChange={(e) => updateTitle(e.target.value)}
          className="flex-1 text-[15px] font-semibold text-zen-ink bg-transparent outline-none border-none"
          placeholder="Untitled"
        />
        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-600 font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      <div className="px-4 py-3 space-y-1">
        {block.blocks.length === 0 && (
          <div className="text-[12px] text-zen-subtle italic">
            Empty page. Add a block below to get started.
          </div>
        )}
        {block.blocks.map((nb) => (
          <LiveBlockRow
            key={nb.id}
            block={nb}
            onChange={(next) => updateBlock(nb.id, next)}
            onRemove={() => removeBlock(nb.id)}
          />
        ))}
        <AddBlockBar onAdd={(kind) => addBlock(null, kind)} />
      </div>

      <div className="px-4 py-2 border-t border-zen-border bg-zen-canvas/50 flex items-center justify-between text-[10px] text-zen-subtle">
        <div className="flex items-center gap-1.5">
          <IconPage className="h-3 w-3" />
          Notion · {block.pageId}
        </div>
        <div className="flex items-center gap-1.5">
          <IconSparkle className="h-3 w-3 text-zen-accent" />
          Agents can edit this page via tool use
        </div>
      </div>
    </div>
  );
}

function LiveBlockRow({
  block,
  onChange,
  onRemove,
}: {
  block: NotionLiveBlock;
  onChange: (next: NotionLiveBlock) => void;
  onRemove: () => void;
}) {
  return (
    <div className="group flex items-start gap-1">
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 h-5 w-5 mt-0.5 rounded text-zen-subtle hover:text-red-600 hover:bg-zen-surface transition-opacity flex items-center justify-center flex-shrink-0"
        aria-label="Delete block"
      >
        <IconTrash className="h-3 w-3" />
      </button>
      <div className="flex-1 min-w-0">
        <BlockEditor block={block} onChange={onChange} />
      </div>
    </div>
  );
}

function BlockEditor({
  block,
  onChange,
}: {
  block: NotionLiveBlock;
  onChange: (next: NotionLiveBlock) => void;
}) {
  switch (block.type) {
    case 'heading': {
      const sizeClass =
        block.level === 1
          ? 'text-[20px] font-bold'
          : block.level === 2
            ? 'text-[16px] font-semibold'
            : 'text-[14px] font-semibold';
      return (
        <input
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          className={cn(
            'w-full bg-transparent outline-none text-zen-ink border-none py-1',
            sizeClass,
          )}
          placeholder={`Heading ${block.level}`}
        />
      );
    }
    case 'paragraph':
      return (
        <textarea
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          rows={Math.max(1, block.text.split('\n').length)}
          className="w-full bg-transparent outline-none text-[13px] text-zen-ink resize-none leading-relaxed py-0.5"
          placeholder="Type something…"
        />
      );
    case 'bullet':
      return (
        <div className="flex items-start gap-2">
          <span className="text-zen-muted text-[14px] leading-[1.4] mt-0.5">
            •
          </span>
          <input
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            className="flex-1 bg-transparent outline-none text-[13px] text-zen-ink border-none py-0.5"
            placeholder="List item"
          />
        </div>
      );
    case 'todo':
      return (
        <div className="flex items-start gap-2">
          <button
            onClick={() => onChange({ ...block, checked: !block.checked })}
            className={cn(
              'mt-0.5 h-4 w-4 rounded border flex items-center justify-center flex-shrink-0',
              block.checked
                ? 'bg-zen-accent border-zen-accent text-white'
                : 'border-zen-border bg-white hover:border-zen-ink/40',
            )}
          >
            {block.checked && <IconCheck className="h-2.5 w-2.5" />}
          </button>
          <input
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            className={cn(
              'flex-1 bg-transparent outline-none text-[13px] border-none py-0.5',
              block.checked
                ? 'line-through text-zen-subtle'
                : 'text-zen-ink',
            )}
            placeholder="To-do"
          />
        </div>
      );
    case 'callout':
      return (
        <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-amber-50 border border-amber-200">
          <input
            value={block.emoji}
            onChange={(e) =>
              onChange({ ...block, emoji: e.target.value.slice(0, 2) })
            }
            className="w-6 bg-transparent outline-none text-[16px] border-none text-center"
          />
          <textarea
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            rows={Math.max(1, block.text.split('\n').length)}
            className="flex-1 bg-transparent outline-none text-[13px] text-amber-900 resize-none border-none"
            placeholder="Callout text"
          />
        </div>
      );
    case 'code':
      return (
        <div className="rounded-md bg-zen-ink overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
            <input
              value={block.language}
              onChange={(e) =>
                onChange({ ...block, language: e.target.value })
              }
              className="bg-transparent outline-none text-[10px] uppercase tracking-wider text-white/60 border-none w-20"
            />
            <span className="text-[10px] text-white/40">code</span>
          </div>
          <textarea
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            rows={Math.max(2, block.text.split('\n').length)}
            className="w-full bg-transparent outline-none text-[12px] text-emerald-300 font-mono resize-none p-3 leading-relaxed"
            placeholder="// code"
            spellCheck={false}
          />
        </div>
      );
    case 'divider':
      return <hr className="border-zen-border my-2" />;
    case 'table':
      return <TableEditor block={block} onChange={onChange} />;
  }
}

function TableEditor({
  block,
  onChange,
}: {
  block: Extract<NotionLiveBlock, { type: 'table' }>;
  onChange: (next: NotionLiveBlock) => void;
}) {
  // Compute formula sums per column when hasFormulas is set.
  const sums = useMemo(() => {
    if (!block.hasFormulas) return null;
    const out: Record<string, number> = {};
    for (const col of block.columns) {
      let sum = 0;
      let any = false;
      for (const row of block.rows) {
        const cell = row.cells[col];
        const n = parseFloat(cell ?? '');
        if (!Number.isNaN(n)) {
          sum += n;
          any = true;
        }
      }
      if (any) out[col] = sum;
    }
    return out;
  }, [block.columns, block.rows, block.hasFormulas]);

  function updateCell(rowId: string, col: string, value: string) {
    onChange({
      ...block,
      rows: block.rows.map((r) =>
        r.id === rowId ? { ...r, cells: { ...r.cells, [col]: value } } : r,
      ),
    });
  }

  function addRow() {
    const cells: Record<string, string> = {};
    for (const c of block.columns) cells[c] = '';
    onChange({
      ...block,
      rows: [...block.rows, { id: `r:${Date.now()}`, cells }],
    });
  }

  function removeRow(rowId: string) {
    onChange({ ...block, rows: block.rows.filter((r) => r.id !== rowId) });
  }

  function addColumn() {
    const name = `Col ${block.columns.length + 1}`;
    onChange({
      ...block,
      columns: [...block.columns, name],
      rows: block.rows.map((r) => ({
        ...r,
        cells: { ...r.cells, [name]: '' },
      })),
    });
  }

  function renameColumn(oldName: string, newName: string) {
    if (!newName.trim() || newName === oldName) return;
    onChange({
      ...block,
      columns: block.columns.map((c) => (c === oldName ? newName : c)),
      rows: block.rows.map((r) => {
        const cells = { ...r.cells };
        cells[newName] = cells[oldName] ?? '';
        delete cells[oldName];
        return { ...r, cells };
      }),
    });
  }

  function toggleFormulas() {
    onChange({ ...block, hasFormulas: !block.hasFormulas });
  }

  return (
    <div className="rounded-md border border-zen-border bg-white overflow-hidden my-1">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zen-border bg-zen-canvas/60">
        <span className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold">
          Table · {block.rows.length} rows
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleFormulas}
            className={cn(
              'h-5 px-1.5 rounded text-[10px] font-medium border transition-colors',
              block.hasFormulas
                ? 'bg-zen-accent text-white border-zen-accent'
                : 'bg-white text-zen-muted border-zen-border hover:border-zen-ink/40',
            )}
            title="Toggle formula sum row"
          >
            Σ Auto-sum
          </button>
          <button
            onClick={addColumn}
            className="h-5 px-1.5 rounded text-[10px] font-medium border border-zen-border bg-white text-zen-muted hover:border-zen-ink/40"
            title="Add column"
          >
            +Col
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-zen-border bg-zen-canvas/40">
              {block.columns.map((col) => (
                <th key={col} className="text-left px-2 py-1">
                  <input
                    value={col}
                    onChange={(e) => renameColumn(col, e.target.value)}
                    className="w-full bg-transparent text-[11px] font-semibold text-zen-muted outline-none border-none"
                  />
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-zen-border last:border-0 group hover:bg-zen-surface/40"
              >
                {block.columns.map((col) => (
                  <td key={col} className="px-2 py-1">
                    <input
                      value={row.cells[col] ?? ''}
                      onChange={(e) => updateCell(row.id, col, e.target.value)}
                      className="w-full bg-transparent text-zen-ink outline-none border-none"
                    />
                  </td>
                ))}
                <td className="px-1">
                  <button
                    onClick={() => removeRow(row.id)}
                    className="opacity-0 group-hover:opacity-100 h-5 w-5 rounded hover:bg-red-50 text-zen-subtle hover:text-red-600 transition-opacity flex items-center justify-center"
                    aria-label="Delete row"
                  >
                    <IconTrash className="h-2.5 w-2.5" />
                  </button>
                </td>
              </tr>
            ))}
            {sums && (
              <tr className="bg-zen-accentSoft/40 border-t-2 border-zen-accent/30 font-semibold">
                {block.columns.map((col) => (
                  <td key={col} className="px-2 py-1.5 text-zen-ink">
                    {sums[col] !== undefined ? `Σ ${sums[col]}` : ''}
                  </td>
                ))}
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button
        onClick={addRow}
        className="w-full px-3 py-1.5 text-[11px] text-zen-subtle hover:text-zen-ink hover:bg-zen-surface flex items-center gap-1 border-t border-zen-border"
      >
        <IconPlus className="h-3 w-3" />
        New row
      </button>
    </div>
  );
}

function AddBlockBar({
  onAdd,
}: {
  onAdd: (kind: NotionLiveBlock['type']) => void;
}) {
  const [open, setOpen] = useState(false);
  const KINDS: Array<{ kind: NotionLiveBlock['type']; label: string }> = [
    { kind: 'heading', label: 'H2' },
    { kind: 'paragraph', label: 'Text' },
    { kind: 'bullet', label: '• List' },
    { kind: 'todo', label: '☐ To-do' },
    { kind: 'callout', label: '💡 Callout' },
    { kind: 'code', label: '</> Code' },
    { kind: 'divider', label: '— Divider' },
    { kind: 'table', label: '⌗ Table' },
  ];
  return (
    <div className="pt-1">
      {open ? (
        <div className="flex flex-wrap gap-1 p-1.5 rounded-md border border-zen-border bg-zen-canvas/60">
          {KINDS.map((k) => (
            <button
              key={k.kind}
              onClick={() => {
                onAdd(k.kind);
                setOpen(false);
              }}
              className="px-2 py-1 rounded-md text-[11px] text-zen-ink bg-white border border-zen-border hover:border-zen-ink/40 hover:bg-zen-canvas"
            >
              {k.label}
            </button>
          ))}
          <button
            onClick={() => setOpen(false)}
            className="px-2 py-1 rounded-md text-[11px] text-zen-subtle hover:text-zen-ink"
          >
            cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-zen-subtle hover:text-zen-ink hover:bg-zen-surface"
        >
          <IconPlus className="h-3 w-3" />
          Add a block
        </button>
      )}
    </div>
  );
}

function createBlank(kind: NotionLiveBlock['type']): NotionLiveBlock {
  const id = `nb:${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  switch (kind) {
    case 'heading':
      return { id, type: 'heading', level: 2, text: '' };
    case 'paragraph':
      return { id, type: 'paragraph', text: '' };
    case 'bullet':
      return { id, type: 'bullet', text: '' };
    case 'todo':
      return { id, type: 'todo', text: '', checked: false };
    case 'callout':
      return { id, type: 'callout', emoji: '💡', text: '' };
    case 'code':
      return { id, type: 'code', language: 'ts', text: '' };
    case 'divider':
      return { id, type: 'divider' };
    case 'table':
      return {
        id,
        type: 'table',
        columns: ['Item', 'Owner', 'Amount'],
        rows: [
          {
            id: `r:${Date.now()}-a`,
            cells: { Item: '', Owner: '', Amount: '' },
          },
        ],
        hasFormulas: false,
      };
  }
}
