'use client';

import { useMemo, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { MessageRow } from '@/components/chat/MessageRow';
import { IconThread } from '@/components/icons';
import { cn, formatRelative } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { Message } from '@/types';

/**
 * Flat feed of every thread the user is part of. The left rail is a
 * list of thread roots (sorted by most-recently-active), the right
 * pane is the selected thread rendered in place. Click any row to
 * focus its thread.
 */
export function ThreadsView() {
  const messages = useNodeStore(
    useShallow((s) => Object.values(s.messagesById)),
  );
  const channelsById = useNodeStore((s) => s.channelsById);

  // Thread roots = messages that have replies. We walk the set once,
  // bucket by thread id, and pick each bucket's parent.
  const threads = useMemo(() => {
    const rootIds = new Set<string>();
    const lastUpdatedAt: Record<string, string> = {};
    const replyCount: Record<string, number> = {};
    for (const m of messages) {
      if (m.threadId) {
        rootIds.add(m.threadId);
        replyCount[m.threadId] = (replyCount[m.threadId] ?? 0) + 1;
        if (
          !lastUpdatedAt[m.threadId] ||
          m.createdAt > lastUpdatedAt[m.threadId]
        ) {
          lastUpdatedAt[m.threadId] = m.createdAt;
        }
      }
    }
    const byId: Record<string, Message> = {};
    for (const m of messages) byId[m.id] = m;
    const rows = Array.from(rootIds)
      .map((id) => byId[id])
      .filter((m): m is Message => Boolean(m))
      .sort((a, b) =>
        (lastUpdatedAt[b.id] ?? b.createdAt).localeCompare(
          lastUpdatedAt[a.id] ?? a.createdAt,
        ),
      );
    return rows.map((r) => ({
      root: r,
      replies: replyCount[r.id] ?? 0,
      lastActive: lastUpdatedAt[r.id] ?? r.createdAt,
    }));
  }, [messages]);

  const [selected, setSelected] = useState<string | null>(
    threads[0]?.root.id ?? null,
  );

  const activeRoot = selected
    ? messages.find((m) => m.id === selected)
    : undefined;
  const replies = activeRoot
    ? messages
        .filter((m) => m.threadId === activeRoot.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    : [];

  return (
    <>
      <aside className="w-[320px] border-r border-zen-border flex flex-col bg-zen-canvas min-h-0 flex-shrink-0">
        <div className="px-4 pt-4 pb-2">
          <div className="text-[15px] font-semibold text-zen-ink">Threads</div>
          <div className="text-[11px] text-zen-subtle mt-0.5">
            Every active conversation in one place.
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {threads.length === 0 ? (
            <div className="text-[11px] text-zen-subtle italic px-2 py-4 text-center">
              No active threads.
            </div>
          ) : (
            <ul className="space-y-0.5">
              {threads.map(({ root, replies: count, lastActive }) => (
                <li key={root.id}>
                  <button
                    onClick={() => setSelected(root.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-md transition-colors',
                      selected === root.id
                        ? 'bg-zen-surface'
                        : 'hover:bg-zen-surface/60',
                    )}
                  >
                    <div className="flex items-center gap-2 text-[11px] text-zen-subtle">
                      <IconThread className="h-3 w-3 text-zen-muted" />
                      <span className="truncate">
                        {channelsById[root.channelId]?.name ?? 'channel'}
                      </span>
                      <span className="ml-auto tabular-nums flex-shrink-0">
                        {formatRelative(lastActive)}
                      </span>
                    </div>
                    <div className="text-[13px] text-zen-ink font-medium truncate mt-0.5">
                      {root.author.name}
                    </div>
                    <div className="text-[11px] text-zen-muted line-clamp-2 mt-0.5">
                      {root.rawText}
                    </div>
                    <div className="text-[10px] text-zen-accent mt-1">
                      {count} {count === 1 ? 'reply' : 'replies'}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col bg-zen-bg min-w-0">
        {activeRoot ? (
          <>
            <div className="border-b border-zen-border px-8 py-4 flex-shrink-0">
              <div className="text-[15px] font-semibold text-zen-ink">
                Thread — {channelsById[activeRoot.channelId]?.name ?? 'channel'}
              </div>
              <div className="text-[11px] text-zen-subtle">
                Started by {activeRoot.author.name} ·{' '}
                {formatRelative(activeRoot.createdAt)}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="max-w-3xl mx-auto space-y-4">
                <MessageRow message={activeRoot} isThreadRoot />
                {replies.length > 0 && (
                  <div className="border-t border-zen-border pt-4">
                    <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-medium pb-3">
                      {replies.length}{' '}
                      {replies.length === 1 ? 'reply' : 'replies'}
                    </div>
                    <div className="space-y-3">
                      {replies.map((r) => (
                        <MessageRow key={r.id} message={r} isThreadRoot />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zen-subtle text-sm">
            Select a thread to view.
          </div>
        )}
      </div>
    </>
  );
}
