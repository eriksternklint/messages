'use client';

import { useMemo, useState } from 'react';

import { MessageRow } from '@/components/chat/MessageRow';
import { IconSend, IconThread, IconX } from '@/components/icons';
import { dispatch } from '@/lib/events';
import { useNodeStore } from '@/store';
import type { Message } from '@/types';

/**
 * Side-panel that slides in from the right over the tasks column when
 * the user opens a thread. The parent is rendered at the top, followed
 * by the timeline of replies, with a compact composer at the bottom.
 */
export function ThreadPanel() {
  const threadId = useNodeStore((s) => s.openThreadId);
  const close = useNodeStore((s) => s.closeThread);
  const messagesById = useNodeStore((s) => s.messagesById);

  const parent = threadId ? messagesById[threadId] : undefined;
  const replies = useMemo(() => {
    if (!threadId) return [];
    return Object.values(messagesById)
      .filter((m) => m.threadId === threadId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [threadId, messagesById]);

  const [draft, setDraft] = useState('');

  if (!threadId || !parent) return null;

  function send() {
    const trimmed = draft.trim();
    if (!trimmed || !parent) return;
    const reply: Message = {
      id: `local:${Date.now()}`,
      source: 'node-channel',
      channelId: parent.channelId,
      threadId: parent.id,
      author: { id: 'u:you', name: 'You', kind: 'human' },
      createdAt: new Date().toISOString(),
      blocks: [{ type: 'text', content: trimmed }],
      rawText: trimmed,
    };
    dispatch({ kind: 'message.created', message: reply });
    setDraft('');
  }

  return (
    <aside className="fixed top-0 right-0 bottom-0 w-[380px] bg-white border-l border-zen-border shadow-zen-pop z-20 flex flex-col animate-zen-fade">
      <div className="h-11 border-b border-zen-border flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2 text-[13px] font-medium text-zen-ink">
          <IconThread className="h-3.5 w-3.5 text-zen-muted" />
          Thread
        </div>
        <button
          onClick={close}
          className="h-7 w-7 rounded-md hover:bg-zen-surface flex items-center justify-center text-zen-muted"
          aria-label="Close thread"
        >
          <IconX className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <MessageRow message={parent} isThreadRoot />
        {replies.length > 0 && (
          <div className="border-t border-zen-border pt-3">
            <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-medium pb-2">
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </div>
            <div className="space-y-3">
              {replies.map((r) => (
                <MessageRow key={r.id} message={r} isThreadRoot />
              ))}
            </div>
          </div>
        )}
        {replies.length === 0 && (
          <div className="text-[11px] text-zen-subtle italic border-t border-zen-border pt-3">
            No replies yet. Be the first.
          </div>
        )}
      </div>

      <div className="border-t border-zen-border p-3 flex-shrink-0">
        <div className="flex items-end gap-2 border border-zen-border rounded-md bg-white px-2 py-1.5 focus-within:border-zen-ink/40">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Reply in thread…"
            className="flex-1 resize-none bg-transparent outline-none text-[12px] text-zen-ink placeholder:text-zen-subtle leading-relaxed py-1"
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            className="h-6 w-6 rounded-md bg-zen-ink text-white flex items-center justify-center disabled:bg-zen-surface disabled:text-zen-subtle"
            aria-label="Send"
          >
            <IconSend className="h-3 w-3" />
          </button>
        </div>
      </div>
    </aside>
  );
}
