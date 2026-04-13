'use client';

import { useEffect, useRef, useState } from 'react';

import { IconSend, IconSparkle, IconX } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useNodeStore } from '@/store';

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Floating AI chat panel in the bottom-right corner. Ask anything —
 * summarize the channel, draft a reply, find a file. The response is
 * currently mocked with a deterministic template; the API plumbing
 * lands when the real Anthropic key is wired for client calls.
 */
export function AIChatPanel() {
  const open = useNodeStore((s) => s.aiPanelOpen);
  const setOpen = useNodeStore((s) => s.setAIPanelOpen);
  const toggle = useNodeStore((s) => s.toggleAIPanel);
  const activeChannelId = useNodeStore((s) => s.activeChannelId);
  const messagesById = useNodeStore((s) => s.messagesById);
  const messageIdsByChannel = useNodeStore((s) => s.messageIdsByChannel);

  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hi — I'm your Node assistant. Ask me to summarize channels, draft replies, or find anything across your workspace.",
    },
  ]);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 99_999 });
  }, [turns, open]);

  function send() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const userTurn: ChatTurn = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };
    setTurns((prev) => [...prev, userTurn]);
    setDraft('');

    // Mocked assistant response — routes through a naive summarizer
    // of the active channel's recent messages so the feedback feels
    // grounded without a live model call.
    setTimeout(() => {
      const ids = activeChannelId
        ? messageIdsByChannel[activeChannelId] ?? []
        : [];
      const recent = ids
        .slice(-5)
        .map((id) => messagesById[id])
        .filter(Boolean)
        .map((m) => `• ${m!.author.name}: ${m!.rawText.slice(0, 90)}`)
        .join('\n');

      const reply: ChatTurn = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content:
          recent.length > 0
            ? `Here's what I see in the active channel:\n${recent}\n\nWhat would you like to do with this?`
            : "I don't have context for the active channel yet. Try opening a channel with messages.",
      };
      setTurns((prev) => [...prev, reply]);
    }, 500);
  }

  if (!open) {
    return (
      <button
        onClick={toggle}
        className="fixed bottom-5 right-5 z-40 h-11 w-11 rounded-full bg-zen-ink text-white shadow-zen-pop flex items-center justify-center hover:scale-105 transition-transform"
        title="Open AI chat"
        aria-label="Open AI chat"
      >
        <IconSparkle className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 w-[360px] h-[480px] bg-white border border-zen-border rounded-lg shadow-zen-pop flex flex-col animate-zen-pop-in">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zen-border flex-shrink-0">
        <div className="flex items-center gap-2 text-[13px] font-medium text-zen-ink">
          <IconSparkle className="h-3.5 w-3.5 text-zen-accent" />
          Node Assistant
        </div>
        <button
          onClick={() => setOpen(false)}
          className="h-6 w-6 rounded-md hover:bg-zen-surface flex items-center justify-center text-zen-muted"
          aria-label="Close"
        >
          <IconX className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
      >
        {turns.map((turn) => (
          <div
            key={turn.id}
            className={cn(
              'text-[12px] leading-relaxed',
              turn.role === 'user' ? 'text-right' : 'text-left',
            )}
          >
            <div
              className={cn(
                'inline-block max-w-[85%] px-3 py-2 rounded-lg whitespace-pre-wrap',
                turn.role === 'user'
                  ? 'bg-zen-ink text-white'
                  : 'bg-zen-canvas text-zen-ink border border-zen-border',
              )}
            >
              {turn.content}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-zen-border p-2 flex-shrink-0">
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
            placeholder="Ask me anything…"
            className="flex-1 resize-none bg-transparent outline-none text-[12px] text-zen-ink placeholder:text-zen-subtle leading-relaxed py-1 max-h-32"
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
    </div>
  );
}
