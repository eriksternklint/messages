'use client';

import { useShallow } from 'zustand/react/shallow';

import { IconCheck, IconClock, IconPlus } from '@/components/icons';
import { cn, formatRelative } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { ActionItem } from '@/types';

/**
 * Global Task Sidebar — a live 2-way mirror of the master Notion
 * Task Database. For the MVP we render straight from the store; the
 * Notion push/pull sync lands in Step 3 via the Action Engine.
 */
export function RightSidebar() {
  // `useShallow` does element-wise comparison so the new array
  // produced by Object.values doesn't trip useSyncExternalStore's
  // reference check (which would loop until React #185).
  const actions = useNodeStore(
    useShallow((s) => Object.values(s.actionsById)),
  );
  const updateAction = useNodeStore((s) => s.updateAction);

  const open = actions.filter((a) => a.status === 'open');
  const waiting = actions.filter((a) => a.status === 'waiting');
  const done = actions.filter((a) => a.status === 'done');

  function toggle(item: ActionItem) {
    updateAction({
      ...item,
      status: item.status === 'done' ? 'open' : 'done',
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <aside className="border-l border-zen-border flex flex-col bg-zen-bg min-h-0">
      <div className="px-4 py-4 flex items-center justify-between border-b border-zen-border flex-shrink-0">
        <div className="text-sm font-medium text-zen-ink">Tasks</div>
        <button
          className="h-6 w-6 rounded-md hover:bg-zen-surface flex items-center justify-center text-zen-muted"
          aria-label="New task"
        >
          <IconPlus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <Section title="Open" items={open} toggle={toggle} />
        <Section title="Waiting" items={waiting} toggle={toggle} />
        <Section title="Done" items={done} toggle={toggle} muted />
      </div>
      <div className="border-t border-zen-border px-4 py-3 text-[10px] text-zen-subtle flex-shrink-0">
        Synced with Notion · mirror
      </div>
    </aside>
  );
}

function Section({
  title,
  items,
  toggle,
  muted = false,
}: {
  title: string;
  items: ActionItem[];
  toggle: (item: ActionItem) => void;
  muted?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="px-2 pb-1.5 text-[10px] uppercase tracking-wider text-zen-subtle font-medium">
        {title} · {items.length}
      </div>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => toggle(item)}
              className="w-full flex items-start gap-2 px-2 py-1.5 rounded-md text-left hover:bg-zen-surface/60 transition-colors group"
            >
              <div
                className={cn(
                  'mt-0.5 h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                  item.status === 'done'
                    ? 'bg-zen-ink border-zen-ink text-white'
                    : 'border-zen-border group-hover:border-zen-muted',
                )}
              >
                {item.status === 'done' && (
                  <IconCheck className="h-2.5 w-2.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    'text-[13px] truncate',
                    muted || item.status === 'done'
                      ? 'text-zen-subtle line-through'
                      : 'text-zen-ink',
                  )}
                >
                  {item.title}
                </div>
                {item.dueAt && (
                  <div className="flex items-center gap-1 text-[10px] text-zen-subtle mt-0.5">
                    <IconClock className="h-2.5 w-2.5" />
                    {formatRelative(item.dueAt)}
                  </div>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
