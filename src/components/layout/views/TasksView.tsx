'use client';

import { useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import {
  IconCheck,
  IconClock,
  IconPlus,
} from '@/components/icons';
import { cn, formatRelative } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { ActionItem } from '@/types';

type Filter = 'all' | 'open' | 'waiting' | 'done';

/**
 * The Tasks view — replaces the right-rail task strip with a full
 * board-style layout. The left column is a filter rail (all / open /
 * waiting / done / by source) and the center column is the detailed
 * task list with due dates, origin metadata, and quick toggles.
 *
 * Bound to the same `actionsById` store slice as the old sidebar, so
 * completing a task anywhere in the app reflects here instantly.
 */
export function TasksView() {
  const actions = useNodeStore(
    useShallow((s) => Object.values(s.actionsById)),
  );
  const updateAction = useNodeStore((s) => s.updateAction);

  const [filter, setFilter] = useState<Filter>('all');

  const counts = {
    all: actions.length,
    open: actions.filter((a) => a.status === 'open').length,
    waiting: actions.filter((a) => a.status === 'waiting').length,
    done: actions.filter((a) => a.status === 'done').length,
  };

  const filtered =
    filter === 'all'
      ? actions
      : actions.filter((a) => a.status === filter);

  const sorted = [...filtered].sort((a, b) => {
    const ad = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
    const bd = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
    return ad - bd;
  });

  function toggle(item: ActionItem) {
    updateAction({
      ...item,
      status: item.status === 'done' ? 'open' : 'done',
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <>
      <aside className="w-[260px] border-r border-zen-border flex flex-col bg-zen-canvas min-h-0 flex-shrink-0">
        <div className="px-4 pt-4 pb-2">
          <div className="text-[15px] font-semibold text-zen-ink">Tasks</div>
          <div className="text-[11px] text-zen-subtle mt-0.5">
            Live mirror of your Notion task database.
          </div>
        </div>
        <ul className="px-2 mt-2 space-y-0.5">
          {(
            [
              ['all', 'All'],
              ['open', 'Open'],
              ['waiting', 'Waiting'],
              ['done', 'Done'],
            ] as Array<[Filter, string]>
          ).map(([id, label]) => (
            <li key={id}>
              <button
                onClick={() => setFilter(id)}
                className={cn(
                  'w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[13px] transition-colors',
                  filter === id
                    ? 'bg-zen-surface text-zen-ink font-medium'
                    : 'text-zen-muted hover:text-zen-ink hover:bg-zen-surface/60',
                )}
              >
                <span>{label}</span>
                <span className="text-[10px] tabular-nums text-zen-subtle">
                  {counts[id]}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex-1" />
        <div className="border-t border-zen-border px-4 py-3 text-[10px] text-zen-subtle">
          Synced with Notion · mirror
        </div>
      </aside>

      <div className="flex-1 flex flex-col bg-zen-bg min-w-0">
        <div className="border-b border-zen-border px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="text-[15px] font-semibold text-zen-ink capitalize">
              {filter === 'all' ? 'All tasks' : `${filter} tasks`}
            </div>
            <div className="text-[11px] text-zen-subtle">
              {sorted.length} {sorted.length === 1 ? 'task' : 'tasks'}
            </div>
          </div>
          <button className="h-8 px-3 rounded-md bg-zen-ink text-white text-[12px] font-medium hover:bg-zen-accent transition-colors flex items-center gap-1.5 shadow-zen-soft">
            <IconPlus className="h-3.5 w-3.5" />
            New task
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {sorted.length === 0 ? (
            <div className="text-center text-zen-subtle text-sm mt-20">
              Nothing here. Clear inbox, clear mind.
            </div>
          ) : (
            <ul className="max-w-3xl mx-auto space-y-1">
              {sorted.map((item) => (
                <TaskRow key={item.id} item={item} onToggle={() => toggle(item)} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function TaskRow({
  item,
  onToggle,
}: {
  item: ActionItem;
  onToggle: () => void;
}) {
  const isDone = item.status === 'done';
  return (
    <li>
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-left hover:bg-zen-canvas/70 transition-colors group border border-transparent hover:border-zen-border"
      >
        <div
          className={cn(
            'mt-0.5 h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
            isDone
              ? 'bg-zen-ink border-zen-ink text-white'
              : 'border-zen-strong group-hover:border-zen-ink',
          )}
        >
          {isDone && <IconCheck className="h-2.5 w-2.5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              'text-[14px]',
              isDone ? 'text-zen-subtle line-through' : 'text-zen-ink',
            )}
          >
            {item.title}
          </div>
          {item.description && (
            <div className="text-[12px] text-zen-muted mt-0.5 line-clamp-2">
              {item.description}
            </div>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-zen-subtle">
            {item.dueAt && (
              <span className="flex items-center gap-1">
                <IconClock className="h-2.5 w-2.5" />
                {formatRelative(item.dueAt)}
              </span>
            )}
            {item.createdFrom && (
              <span className="uppercase tracking-wider">
                from {item.createdFrom.source}
              </span>
            )}
            {item.status === 'waiting' && (
              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                waiting
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}
