'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { QuotedMessage, useQuotePreview } from '@/components/chat/QuotedMessage';
import { IconPage, IconSend, IconSparkle } from '@/components/icons';
import { dispatch } from '@/lib/events';
import { cn } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { Message, MessageBlock, NotionLiveBlock } from '@/types';

interface SlashCommand {
  command: string;
  args: string;
  description: string;
}

/**
 * The universal Slash Command palette. The composer has three modes:
 *
 *  1. Idle — empty state, caret visible, placeholder shown.
 *  2. Draft-pending — AI has pre-filled a response. Rendered italic in
 *     zen-subtle gray so the user can tell at a glance it was drafted.
 *     Enter sends as-is. Right-click promotes the draft into edit mode
 *     (the user can rewrite it). Any click on the textarea clears the
 *     draft and gives the user a blank canvas.
 *  3. Composing — normal text entry, ink coloured, no italic.
 *
 * Slash commands dispatch against `/api/commands/run` which actually
 * executes the Notion side-effect and returns an ack message.
 */
const COMMANDS: SlashCommand[] = [
  {
    command: '/notion-page',
    args: '[title]',
    description: 'Create a Notion page with sections, todos and a checklist',
  },
  {
    command: '/notion-table',
    args: '[title]',
    description: 'Drop a 4×3 starter table into the pinned Notion page',
  },
  {
    command: '/notion-todo',
    args: '[text]',
    description: 'Append a to-do block to the pinned Notion page',
  },
  {
    command: '/update-block',
    args: '[text]',
    description: 'Append a paragraph to the pinned Notion page',
  },
  {
    command: '/notion-search',
    args: '[query]',
    description: 'Search your Notion workspace',
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
  // When true, the current `text` IS the AI draft (untouched). Render
  // as italic gray and treat clicks as "accept or discard" gestures.
  const [draftMode, setDraftMode] = useState(Boolean(initialValue));
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const quoteMessageId = useNodeStore((s) => s.quoteMessageId);
  const setQuote = useNodeStore((s) => s.setQuote);
  const quotePreview = useQuotePreview(quoteMessageId);

  // When the active channel or the AI-drafted response changes, reset
  // the input so the user always sees the current pre-fill and reset
  // draft-mode. The user can still edit or discard.
  useEffect(() => {
    setText(initialValue ?? '');
    setDraftMode(Boolean(initialValue));
  }, [channelId, initialValue]);

  // Autosize — grow with content, cap at 200px.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [text]);

  const showSlashMenu = !draftMode && text.startsWith('/');
  const matching = useMemo(() => {
    if (!showSlashMenu) return [];
    const first = text.split(/\s+/)[0];
    return COMMANDS.filter((c) => c.command.startsWith(first));
  }, [showSlashMenu, text]);

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Auto-detect markdown: bold/italic, headings, lists, code fences,
    // blockquotes — any of these promote the block from plain text to
    // markdown so the receiver renders the formatting.
    const looksMarkdown = /(\*\*|__|`|^#|^- |^\d+\. |^>|^```)/m.test(trimmed);
    const block: MessageBlock = looksMarkdown
      ? { type: 'markdown', content: trimmed }
      : { type: 'text', content: trimmed };

    const message: Message = {
      id: `local:${Date.now()}`,
      source: 'node-channel',
      channelId,
      author: { id: 'u:you', name: 'You', kind: 'human' },
      createdAt: new Date().toISOString(),
      blocks: [block],
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

    // For slash commands, hit the server runner so the side-effect
    // (Notion create/append/search) really happens, then dispatch
    // the returned ack. If the route is unreachable (offline preview
    // etc.) we fall back to a synthetic ack so the UX never stalls.
    if (trimmed.startsWith('/')) {
      runSlashCommandAsync(trimmed, channelId);
    }

    setText('');
    setDraftMode(false);
  }

  /**
   * Wraps the current selection (or inserts a placeholder) with the
   * given before/after fragments. Used by the bold/italic/code buttons.
   */
  function wrapSelection(before: string, after = before, placeholder = 'text') {
    const ta = textareaRef.current;
    if (!ta) {
      setText((t) => `${t}${before}${placeholder}${after}`);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = text.slice(start, end) || placeholder;
    const next = `${text.slice(0, start)}${before}${selected}${after}${text.slice(end)}`;
    setText(next);
    setDraftMode(false);
    requestAnimationFrame(() => {
      ta.focus();
      const cursorStart = start + before.length;
      ta.setSelectionRange(cursorStart, cursorStart + selected.length);
    });
  }

  /** Prefix the current line(s) with a marker — bullet list, numbered, quote. */
  function prefixLine(prefix: string) {
    const ta = textareaRef.current;
    if (!ta) {
      setText((t) => `${prefix}${t}`);
      return;
    }
    const start = ta.selectionStart;
    // Find start of the current line.
    const before = text.slice(0, start);
    const lineStart = before.lastIndexOf('\n') + 1;
    const next = `${text.slice(0, lineStart)}${prefix}${text.slice(lineStart)}`;
    setText(next);
    setDraftMode(false);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + prefix.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  /**
   * Insert a brand new live Notion page into the channel — with a
   * starter section, a todo, and a math table. Goes through dispatch
   * so the receiver and store both see it.
   */
  function insertLivePage() {
    const pageId = `lp:${Date.now()}`;
    const blocks: NotionLiveBlock[] = [
      { id: `${pageId}:h`, type: 'heading', level: 2, text: 'Untitled section' },
      {
        id: `${pageId}:p`,
        type: 'paragraph',
        text: 'Edit me. Everyone in this channel sees the same page in real time.',
      },
      {
        id: `${pageId}:t`,
        type: 'todo',
        text: 'A first task',
        checked: false,
      },
      {
        id: `${pageId}:tbl`,
        type: 'table',
        columns: ['Item', 'Owner', 'Amount'],
        rows: [
          {
            id: `${pageId}:r1`,
            cells: { Item: 'Onboarding swag', Owner: 'You', Amount: '120' },
          },
          {
            id: `${pageId}:r2`,
            cells: { Item: 'Notion seats', Owner: 'You', Amount: '90' },
          },
        ],
        hasFormulas: true,
      },
    ];
    const liveBlock: MessageBlock = {
      type: 'notion-live-page',
      pageId,
      title: 'Untitled live page',
      icon: '📄',
      blocks,
    };
    const message: Message = {
      id: `local:lp-${Date.now()}`,
      source: 'node-channel',
      channelId,
      author: { id: 'u:you', name: 'You', kind: 'human' },
      createdAt: new Date().toISOString(),
      blocks: [liveBlock],
      rawText: 'Created a live Notion page',
    };
    dispatch({ kind: 'message.created', message });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter with an un-edited AI draft sends it as-is. Same key-combo
    // works in compose mode.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
      return;
    }
    // Any non-navigation keystroke on a draft promotes it to edit mode
    // so the user can freely rewrite without the italic styling.
    if (draftMode && e.key.length === 1) {
      setDraftMode(false);
    }
    if (draftMode && e.key === 'Backspace') {
      // Backspace on a draft clears the whole thing — matches Gmail.
      e.preventDefault();
      setText('');
      setDraftMode(false);
    }
  }

  // Single click on the textarea wipes the draft — the user wanted a
  // blank canvas. Right-click takes the edit path instead.
  function onClick() {
    if (draftMode) {
      setText('');
      setDraftMode(false);
    }
  }

  // Right-click promotes the draft into edit mode without wiping it.
  function onContextMenu(e: React.MouseEvent<HTMLTextAreaElement>) {
    if (draftMode) {
      e.preventDefault();
      setDraftMode(false);
      textareaRef.current?.focus();
    }
  }

  return (
    <div className="relative">
      {showSlashMenu && matching.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-zen-border rounded-lg shadow-zen-pop overflow-hidden">
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

      {draftMode && (
        <div className="mb-2 flex items-center gap-1.5 text-[11px]">
          <IconSparkle className="h-3 w-3 text-zen-accent" />
          <span className="text-zen-muted">AI drafted this reply.</span>
          <span className="ml-auto text-zen-subtle">
            Enter to send · click to clear · right-click to edit
          </span>
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
          'flex flex-col gap-1 border rounded-lg px-2 pt-1.5 pb-2 transition-colors bg-white',
          focused ? 'border-zen-ink/60 shadow-zen-soft' : 'border-zen-border',
          draftMode && 'bg-zen-accentSoft/40 border-zen-accent/40',
        )}
      >
        <div className="flex items-center gap-0.5 px-1">
          <ToolbarButton
            label="B"
            tooltip="Bold (markdown)"
            bold
            onClick={() => wrapSelection('**')}
          />
          <ToolbarButton
            label="I"
            tooltip="Italic"
            italic
            onClick={() => wrapSelection('*')}
          />
          <ToolbarButton
            label="<>"
            tooltip="Inline code"
            mono
            onClick={() => wrapSelection('`')}
          />
          <ToolbarDivider />
          <ToolbarButton
            label="H1"
            tooltip="Heading 1"
            onClick={() => prefixLine('# ')}
          />
          <ToolbarButton
            label="H2"
            tooltip="Heading 2"
            onClick={() => prefixLine('## ')}
          />
          <ToolbarDivider />
          <ToolbarButton
            label="•"
            tooltip="Bulleted list"
            onClick={() => prefixLine('- ')}
          />
          <ToolbarButton
            label="1."
            tooltip="Numbered list"
            onClick={() => prefixLine('1. ')}
          />
          <ToolbarButton
            label="☐"
            tooltip="To-do"
            onClick={() => prefixLine('- [ ] ')}
          />
          <ToolbarDivider />
          <ToolbarButton
            label="❝"
            tooltip="Quote"
            onClick={() => prefixLine('> ')}
          />
          <ToolbarButton
            label="💡"
            tooltip="Callout"
            onClick={() => prefixLine('> 💡 ')}
          />
          <ToolbarButton
            label="```"
            tooltip="Code block"
            mono
            onClick={() => wrapSelection('\n```\n', '\n```\n', 'code')}
          />
          <ToolbarButton
            label="| |"
            tooltip="Markdown table"
            mono
            onClick={() =>
              wrapSelection(
                '\n| Item | Owner | Amount |\n| --- | --- | --- |\n| ',
                ' |  |  |\n',
                '',
              )
            }
          />
          <ToolbarDivider />
          <button
            onClick={insertLivePage}
            className="ml-auto h-6 px-2 rounded-md flex items-center gap-1 text-[10px] font-semibold text-white bg-zen-accent hover:bg-[#1a6fc5] transition-colors"
            title="Insert a collaborative Notion page (live, agent-editable)"
          >
            <IconPage className="h-3 w-3" />
            Live page
          </button>
        </div>
        <div className="flex items-end gap-2 px-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            onClick={onClick}
            onContextMenu={onContextMenu}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Message, or type / for commands"
            rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent outline-none leading-relaxed py-1 placeholder:text-zen-subtle',
              draftMode
                ? 'italic text-[15px] text-zen-subtle'
                : 'text-[13px] text-zen-ink',
            )}
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            className={cn(
              'flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center transition-colors shadow-zen-soft',
              text.trim()
                ? 'bg-zen-accent text-white hover:bg-[#1a6fc5]'
                : 'bg-zen-surface text-zen-subtle cursor-not-allowed',
            )}
            aria-label="Send"
          >
            <IconSend className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-zen-subtle px-1">
        <span>Enter to send · Shift+Enter for newline · / for commands</span>
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  tooltip,
  onClick,
  bold,
  italic,
  mono,
}: {
  label: string;
  tooltip: string;
  onClick: () => void;
  bold?: boolean;
  italic?: boolean;
  mono?: boolean;
}) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={tooltip}
      className={cn(
        'h-6 min-w-[24px] px-1 rounded text-[11px] text-zen-muted hover:text-zen-ink hover:bg-zen-surface transition-colors flex items-center justify-center',
        bold && 'font-bold',
        italic && 'italic',
        mono && 'font-mono',
      )}
    >
      {label}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="h-4 w-px bg-zen-border mx-1" />;
}

/**
 * Fire-and-forget POST to /api/commands/run. The runner returns a
 * pre-built ack `Message`; we dispatch it through the same event bus
 * the rest of the app uses so the orchestrator and store stay in sync.
 */
function runSlashCommandAsync(text: string, channelId: string): void {
  fetch('/api/commands/run', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, channelId }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`HTTP ${res.status}: ${detail}`);
      }
      const data = (await res.json()) as { ackMessage: Message };
      if (!data?.ackMessage) throw new Error('malformed response');
      dispatch({ kind: 'message.created', message: data.ackMessage });
    })
    .catch((err: Error) => {
      console.error('[command] runner failed', err);
      const fallback: Message = {
        id: `local:${Date.now()}-ack`,
        source: 'system',
        channelId,
        author: { id: 'system', name: 'Node', kind: 'system' },
        createdAt: new Date().toISOString(),
        blocks: [
          {
            type: 'markdown',
            content: `⚠ Couldn't execute \`${text}\`: ${err.message}`,
          },
        ],
        rawText: `Failed to execute ${text}`,
      };
      dispatch({ kind: 'message.created', message: fallback });
    });
}
