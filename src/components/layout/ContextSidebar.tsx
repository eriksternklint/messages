'use client';

import { useMemo, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { Avatar } from '@/components/chat/Avatar';
import { MessageRow } from '@/components/chat/MessageRow';
import {
  IconRobot,
  IconSend,
  IconSparkle,
  IconThread,
  IconX,
} from '@/components/icons';
import { dispatch } from '@/lib/events';
import { cn, formatRelative } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { Message } from '@/types';

/**
 * Context rail on the far right. Collapses to zero width when there's
 * nothing to show, which is the default — keeping the message list at
 * full width. Three mutually-exclusive modes:
 *
 *  1. Thread mode — `openThreadId` is set. Shows the parent + replies
 *     + an inline composer, just like the old ThreadPanel did, but
 *     now inline in the grid.
 *  2. AI context mode — active channel has a message with a drafted
 *     response. Shows the prompt, the draft, matched sources, and any
 *     agents assigned to the channel.
 *  3. Nothing — returns null.
 */
export function ContextSidebar() {
  const openThreadId = useNodeStore((s) => s.openThreadId);
  const closeThread = useNodeStore((s) => s.closeThread);
  const messagesById = useNodeStore((s) => s.messagesById);
  const activeChannelId = useNodeStore((s) => s.activeChannelId);
  const channel = useNodeStore((s) =>
    activeChannelId ? s.channelsById[activeChannelId] : undefined,
  );
  const agentsById = useNodeStore((s) => s.agentsById);
  const messageIds = useNodeStore(
    useShallow((s) =>
      activeChannelId ? s.messageIdsByChannel[activeChannelId] ?? [] : [],
    ),
  );

  // Look up the most-recent action-priority message with a draft —
  // that's the one the composer is currently pre-filling.
  const contextMessage = useMemo<Message | null>(() => {
    for (let i = messageIds.length - 1; i >= 0; i--) {
      const m = messagesById[messageIds[i]];
      if (m?.ai?.draftedResponse && m.author.id !== 'u:you') return m;
    }
    return null;
  }, [messageIds, messagesById]);

  if (openThreadId) {
    const parent = messagesById[openThreadId];
    if (!parent) return null;
    return <ThreadContext parent={parent} onClose={closeThread} />;
  }

  if (contextMessage && channel) {
    const agents = (channel.agentIds ?? [])
      .map((id) => agentsById[id])
      .filter((a): a is NonNullable<typeof a> => Boolean(a));
    return <AIContext message={contextMessage} agents={agents} />;
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
  const replies = useMemo(
    () =>
      Object.values(messagesById)
        .filter((m) => m.threadId === parent.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messagesById, parent.id],
  );
  const [draft, setDraft] = useState('');

  function send() {
    const trimmed = draft.trim();
    if (!trimmed) return;
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
    <aside className="w-[360px] border-l border-zen-border bg-zen-bg flex flex-col min-h-0 flex-shrink-0 animate-zen-fade">
      <div className="h-11 border-b border-zen-border flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-zen-ink">
          <IconThread className="h-3.5 w-3.5 text-zen-muted" />
          Thread
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
            placeholder="Reply in thread…"
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

function AIContext({
  message,
  agents,
}: {
  message: Message;
  agents: Array<{ id: string; name: string; persona: string }>;
}) {
  return (
    <aside className="w-[320px] border-l border-zen-border bg-zen-bg flex flex-col min-h-0 flex-shrink-0 animate-zen-fade">
      <div className="h-11 border-b border-zen-border flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-zen-ink">
          <IconSparkle className="h-3.5 w-3.5 text-zen-accent" />
          Context
        </div>
        <span className="text-[10px] text-zen-subtle uppercase tracking-wider">
          Active message
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-[12px]">
        <section>
          <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold pb-1">
            From
          </div>
          <div className="flex items-center gap-2">
            <Avatar name={message.author.name} size="sm" kind={message.author.kind} />
            <div className="text-zen-ink font-medium">
              {message.author.name}
            </div>
            <div className="text-zen-subtle ml-auto">
              {formatRelative(message.createdAt)}
            </div>
          </div>
          <div className="mt-1 text-zen-muted italic line-clamp-3">
            “{message.rawText}”
          </div>
        </section>

        {message.ai?.draftedResponse && (
          <section>
            <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold pb-1">
              Drafted reply
            </div>
            <div className="p-3 rounded-md bg-zen-accentSoft/50 border border-zen-accent/20 italic text-zen-ink leading-relaxed">
              {message.ai.draftedResponse}
            </div>
            {message.ai.confidence !== undefined && (
              <div className="mt-1.5 text-[10px] text-zen-subtle">
                Confidence {Math.round(message.ai.confidence * 100)}%
              </div>
            )}
          </section>
        )}

        {message.ai?.contextSources && message.ai.contextSources.length > 0 && (
          <section>
            <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold pb-1">
              Sources
            </div>
            <ul className="space-y-1">
              {message.ai.contextSources.map((src) => (
                <li
                  key={src}
                  className="px-2 py-1 rounded border border-zen-border bg-zen-canvas text-zen-ink font-mono text-[11px]"
                >
                  {src}
                </li>
              ))}
            </ul>
          </section>
        )}

        {message.ai?.intentTags && message.ai.intentTags.length > 0 && (
          <section>
            <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold pb-1">
              Intent
            </div>
            <div className="flex flex-wrap gap-1">
              {message.ai.intentTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-zen-canvas border border-zen-border text-zen-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {agents.length > 0 && (
          <section>
            <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold pb-1 flex items-center gap-1">
              <IconRobot className="h-3 w-3" /> Agents in this channel
            </div>
            <ul className="space-y-1">
              {agents.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-zen-canvas border border-zen-border"
                >
                  <Avatar name={a.name} kind="agent" size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-zen-ink truncate">{a.name}</div>
                    <div className="text-[10px] text-zen-subtle truncate">
                      {a.persona}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </aside>
  );
}
