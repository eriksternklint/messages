'use client';

import { useMemo, useState } from 'react';

import { AIAgentPanel } from '@/components/ai/AIAgentPanel';
import { MessageRow } from '@/components/chat/MessageRow';
import { IconSend, IconSparkle, IconThread, IconX } from '@/components/icons';
import { dispatch } from '@/lib/events';
import { tryRunLivePageCommand } from '@/lib/ai/live-page-commands';
import { cn } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { Message } from '@/types';

/**
 * Context rail on the far right. Two mutually-exclusive modes that can
 * occupy the rail — and nothing renders unless one is active:
 *
 *  1. Thread mode — `openThreadId` is set. Shows the parent + replies
 *     + an inline composer.
 *  2. AI Agent mode — `aiAgentOpen` is true. Shows the right-sidebar
 *     AI Agent with real workspace tool use.
 *
 * Channel-level context (members, links, agents, settings) lives in
 * the channel header's tab panel, not here.
 */
export function ContextSidebar() {
  const openThreadId = useNodeStore((s) => s.openThreadId);
  const aiAgentOpen = useNodeStore((s) => s.aiAgentOpen);
  const closeThread = useNodeStore((s) => s.closeThread);
  const messagesById = useNodeStore((s) => s.messagesById);

  if (openThreadId) {
    const parent = messagesById[openThreadId];
    if (!parent) return null;
    return <ThreadContext parent={parent} onClose={closeThread} />;
  }

  if (aiAgentOpen) {
    return <AIAgentPanel />;
  }

  return null;
}

function ThreadContext({
  parent,
  onClose,
}: {
  parent: Message;
  onClose: () => void;
}) {
  const messagesById = useNodeStore((s) => s.messagesById);
  const updateMessage = useNodeStore((s) => s.updateMessage);
  const replies = useMemo(
    () =>
      Object.values(messagesById)
        .filter((m) => m.threadId === parent.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messagesById, parent.id],
  );
  const [draft, setDraft] = useState('');

  const hasLivePage = parent.blocks.some((b) => b.type === 'notion-live-page');

  function send() {
    const trimmed = draft.trim();
    if (!trimmed) return;

    // If the thread's parent message contains a live Notion page, try
    // to interpret the reply as a direct mutation of that page. If it
    // parses, we update the parent in place AND drop a system ack into
    // the thread so the user sees their change landed.
    if (hasLivePage) {
      const latestParent = messagesById[parent.id] ?? parent;
      const result = tryRunLivePageCommand(trimmed, latestParent);
      if (result) {
        updateMessage(result.message);
        dispatch({ kind: 'message.updated', message: result.message });
        const ack: Message = {
          id: `local:live-ack-${Date.now()}`,
          source: 'system',
          channelId: parent.channelId,
          threadId: parent.id,
          author: { id: 'system', name: 'Node', kind: 'system' },
          createdAt: new Date().toISOString(),
          blocks: [
            { type: 'markdown', content: `✓ ${result.summary}` },
          ],
          rawText: result.summary,
        };
        dispatch({ kind: 'message.created', message: ack });
        setDraft('');
        return;
      }
    }

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
    <aside className="w-[400px] border-l border-zen-border bg-zen-bg flex flex-col min-h-0 flex-shrink-0 animate-zen-fade">
      <div className="h-11 border-b border-zen-border flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-zen-ink">
          <IconThread className="h-3.5 w-3.5 text-zen-muted" />
          Thread
          {hasLivePage && (
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zen-accent font-semibold">
              <IconSparkle className="h-2.5 w-2.5" />
              Live page
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 rounded-md hover:bg-zen-surface flex items-center justify-center text-zen-muted"
          aria-label="Close thread"
        >
          <IconX className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <MessageRow message={parent} isThreadRoot />
        {replies.length > 0 ? (
          <div className="border-t border-zen-border pt-3">
            <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold pb-2">
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </div>
            <div className="space-y-3">
              {replies.map((r) => (
                <MessageRow key={r.id} message={r} isThreadRoot />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-zen-subtle italic border-t border-zen-border pt-3">
            No replies yet. Be the first.
          </div>
        )}
      </div>

      <div className="border-t border-zen-border p-3 flex-shrink-0">
        {hasLivePage && (
          <div className="mb-2 px-2 py-1.5 rounded-md bg-zen-accentSoft/60 border border-zen-accent/20 text-[10px] text-zen-muted leading-snug">
            <div className="flex items-center gap-1 font-semibold text-zen-accent mb-0.5">
              <IconSparkle className="h-2.5 w-2.5" />
              Edit the page with a message
            </div>
            Try: <span className="font-mono text-zen-ink">add row Launch | Erik | 300</span>,{' '}
            <span className="font-mono text-zen-ink">add todo Book venue</span>,{' '}
            <span className="font-mono text-zen-ink">rename column Owner to Lead</span>.
          </div>
        )}
        <div className="flex items-end gap-2 border border-zen-border rounded-md bg-white px-2 py-1.5 focus-within:border-zen-ink/60 focus-within:shadow-zen-soft">
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
            placeholder={hasLivePage ? 'Reply — or type a command to edit the page…' : 'Reply in thread…'}
            className="flex-1 resize-none bg-transparent outline-none text-[12px] text-zen-ink placeholder:text-zen-subtle leading-relaxed py-1"
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            className={cn(
              'h-7 w-7 rounded-md flex items-center justify-center transition-colors',
              draft.trim()
                ? 'bg-zen-accent text-white hover:bg-[#1a6fc5]'
                : 'bg-zen-surface text-zen-subtle cursor-not-allowed',
            )}
            aria-label="Send"
          >
            <IconSend className="h-3 w-3" />
          </button>
        </div>
      </div>
    </aside>
  );
}
