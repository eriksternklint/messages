'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { QuotedMessage, useQuotePreview } from '@/components/chat/QuotedMessage';
import { IconSend, IconSparkle } from '@/components/icons';
import { dispatch } from '@/lib/events';
import { cn } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { Message } from '@/types';

interface SlashCommand {
  command: string;
  args: string;
  description: string;
}

/**
 * The universal Slash Command palette. Step 3 will wire these to real
 * side-effects (Notion / HubSpot / reminders); for now the input
 * dispatches the user message and synthesizes a system acknowledgement
 * so the feedback loop is visible.
 */
const COMMANDS: SlashCommand[] = [
  {
    command: '/notion-page',
    args: '[title]',
    description: 'Create a new Notion page and drop the link',
  },
  {
    command: '/update-block',
    args: '[text]',
    description: 'Update a Notion block live',
  },
  {
    command: '/hs-update-deal',
    args: '[value]',
    description: 'Push CRM update to HubSpot',
  },
  {
    command: '/remind',
    args: '[when] [what]',
    description: 'Remind me later — adds to the Task sidebar',
  },
  { command: '/ai', args: '[prompt]', description: 'Ask the AI' },
];

export function CommandInput({
  channelId,
  initialValue,
}: {
  channelId: string;
  initialValue?: string;
}) {
  const [text, setText] = useState(initialValue ?? '');
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const quoteMessageId = useNodeStore((s) => s.quoteMessageId);
  const setQuote = useNodeStore((s) => s.setQuote);
  const quotePreview = useQuotePreview(quoteMessageId);

  // When the active channel or the AI-drafted response changes, reset
  // the input so the user always sees the current pre-fill.
  useEffect(() => {
    setText(initialValue ?? '');
  }, [channelId, initialValue]);

  // Autosize — grow with content, cap at 200px.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [text]);

  const showSlashMenu = text.startsWith('/');
  const matching = useMemo(() => {
    if (!showSlashMenu) return [];
    const first = text.split(/\s+/)[0];
    return COMMANDS.filter((c) => c.command.startsWith(first));
  }, [showSlashMenu, text]);

  const hasDraft = Boolean(
    initialValue && text === initialValue && text.length > 0,
  );

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;

    const message: Message = {
      id: `local:${Date.now()}`,
      source: 'node-channel',
      channelId,
      author: { id: 'u:you', name: 'You', kind: 'human' },
      createdAt: new Date().toISOString(),
      blocks: [{ type: 'text', content: trimmed }],
      rawText: trimmed,
      replyTo: quotePreview
        ? {
            messageId: quotePreview.messageId,
            authorName: quotePreview.authorName,
            preview: quotePreview.preview,
          }
        : undefined,
    };
    dispatch({ kind: 'message.created', message });
    if (quoteMessageId) setQuote(null);

    // For slash commands, synthesize a system acknowledgement so the
    // command cycle feels real in the MVP. Step 3 replaces this with
    // actual API calls via the Action Engine.
    if (trimmed.startsWith('/')) {
      setTimeout(() => {
        const ack: Message = {
          id: `local:${Date.now()}-ack`,
          source: 'system',
          channelId,
          author: { id: 'system', name: 'Node', kind: 'system' },
          createdAt: new Date().toISOString(),
          blocks: [
            {
              type: 'markdown',
              content: `Executed \`${trimmed}\` — mocked. Real Notion / HubSpot / reminder calls arrive in Step 3.`,
            },
          ],
          rawText: `Executed ${trimmed}`,
        };
        dispatch({ kind: 'message.created', message: ack });
      }, 350);
    }

    setText('');
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="relative">
      {showSlashMenu && matching.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-zen-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-zen-subtle border-b border-zen-border">
            Commands
          </div>
          <ul>
            {matching.map((cmd) => (
              <li key={cmd.command}>
                <button
                  onMouseDown={(e) => {
                    // Prevent textarea blur before the click fires.
                    e.preventDefault();
                  }}
                  onClick={() => {
                    setText(cmd.command + ' ');
                    textareaRef.current?.focus();
                  }}
                  className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-zen-surface transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <code className="text-[12px] font-mono text-zen-ink">
                      {cmd.command}
                    </code>
                    <span className="text-[11px] text-zen-subtle">
                      {cmd.args}
                    </span>
                  </div>
                  <span className="text-[11px] text-zen-muted">
                    {cmd.description}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasDraft && (
        <div className="mb-2 flex items-center gap-1.5 text-[11px] text-zen-muted">
          <IconSparkle className="h-3 w-3" />
          AI drafted this response — edit or send as is
        </div>
      )}

      {quotePreview && (
        <QuotedMessage
          authorName={quotePreview.authorName}
          preview={quotePreview.preview}
          onDismiss={() => setQuote(null)}
        />
      )}

      <div
        className={cn(
          'flex items-end gap-2 border rounded-lg px-3 py-2 transition-colors bg-white',
          focused ? 'border-zen-ink/40' : 'border-zen-border',
        )}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Message, or type / for commands"
          rows={1}
          className="flex-1 resize-none bg-transparent outline-none text-[13px] text-zen-ink placeholder:text-zen-subtle leading-relaxed py-1"
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          className={cn(
            'flex-shrink-0 h-7 w-7 rounded-md flex items-center justify-center transition-colors',
            text.trim()
              ? 'bg-zen-ink text-white hover:bg-zen-accent'
              : 'bg-zen-surface text-zen-subtle cursor-not-allowed',
          )}
          aria-label="Send"
        >
          <IconSend className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-zen-subtle px-1">
        <span>Enter to send · Shift+Enter for newline · / for commands</span>
      </div>
    </div>
  );
}
