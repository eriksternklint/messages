'use client';

import { useState } from 'react';

import { Avatar } from '@/components/chat/Avatar';
import { BlockRenderer } from '@/components/chat/BlockRenderer';
import { QuotedMessage } from '@/components/chat/QuotedMessage';
import {
  IconBell,
  IconCheck,
  IconMoreHorizontal,
  IconPencil,
  IconReply,
  IconSparkle,
  IconThread,
  IconTrash,
} from '@/components/icons';
import { dispatch } from '@/lib/events';
import { cn, formatRelative } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { Message } from '@/types';

/**
 * A single message row. Extracted from MainColumn so the hover toolbar
 * and edit-in-place state stay local. Supports thread replies, quote
 * reply, edit, delete, mark-unread and remind-me.
 */
export function MessageRow({
  message,
  onOpenThread,
  isThreadRoot,
}: {
  message: Message;
  onOpenThread?: (messageId: string) => void;
  /** True when this row is rendered at the top of the thread panel. */
  isThreadRoot?: boolean;
}) {
  const updateMessage = useNodeStore((s) => s.updateMessage);
  const deleteMessage = useNodeStore((s) => s.deleteMessage);
  const setQuote = useNodeStore((s) => s.setQuote);
  const openThread = useNodeStore((s) => s.openThread);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const isYou = message.author.id === 'u:you';
  const firstText = message.blocks.find((b) => b.type === 'text');
  const primaryText =
    firstText && firstText.type === 'text' ? firstText.content : undefined;

  function startEdit() {
    setDraft(primaryText ?? message.rawText);
    setEditing(true);
    setMenuOpen(false);
  }

  function saveEdit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    updateMessage({
      ...message,
      edited: true,
      editedAt: new Date().toISOString(),
      rawText: trimmed,
      blocks: message.blocks.map((b) =>
        b.type === 'text' ? { ...b, content: trimmed } : b,
      ),
    });
    setEditing(false);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft('');
  }

  function onDelete() {
    setMenuOpen(false);
    dispatch({ kind: 'message.deleted', id: message.id });
  }

  function onMarkUnread() {
    setMenuOpen(false);
    updateMessage({ ...message, unread: !message.unread });
  }

  function onRemind() {
    setMenuOpen(false);
    const remindAt = new Date(Date.now() + 60 * 60_000).toISOString();
    updateMessage({ ...message, remindAt });
  }

  function onThreadClick() {
    const id = message.threadId ?? message.id;
    openThread(id);
    onOpenThread?.(id);
  }

  function onReply() {
    setQuote(message.id);
  }

  return (
    <div
      className={cn(
        'flex gap-3 group rounded-md px-2 py-1 -mx-2 relative',
        message.unread ? 'bg-zen-accentSoft/40' : 'hover:bg-zen-canvas/70',
      )}
    >
      <Avatar
        name={message.author.name}
        avatarUrl={message.author.avatarUrl}
        kind={message.author.kind}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[13px] font-medium text-zen-ink">
            {message.author.name}
          </span>
          {message.author.kind === 'agent' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zen-surface border border-zen-border text-zen-muted">
              {message.author.agentPersona ?? 'Agent'}
            </span>
          )}
          <span className="text-[11px] text-zen-subtle">
            {formatRelative(message.createdAt)}
          </span>
          {message.edited && (
            <span className="text-[10px] text-zen-subtle italic">edited</span>
          )}
          {message.ai?.priority === 'action' && (
            <span className="text-[10px] text-zen-muted flex items-center gap-0.5">
              <IconSparkle className="h-2.5 w-2.5" />
              action
            </span>
          )}
          {message.remindAt && (
            <span className="text-[10px] text-zen-warn flex items-center gap-0.5">
              <IconBell className="h-2.5 w-2.5" />
              remind {formatRelative(message.remindAt)}
            </span>
          )}
        </div>

        {message.replyTo && (
          <QuotedMessage
            authorName={message.replyTo.authorName}
            preview={message.replyTo.preview}
          />
        )}

        {editing ? (
          <div className="mt-1">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              autoFocus
              className="w-full text-[13px] border border-zen-border rounded-md px-2 py-1.5 bg-white outline-none focus:border-zen-ink/40 resize-none"
            />
            <div className="mt-1 flex items-center gap-1.5 text-[11px]">
              <button
                onClick={saveEdit}
                className="px-2 py-0.5 rounded bg-zen-ink text-white hover:bg-zen-accent"
              >
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="px-2 py-0.5 rounded text-zen-muted hover:bg-zen-surface"
              >
                Cancel
              </button>
              <span className="text-zen-subtle">Esc to cancel</span>
            </div>
          </div>
        ) : (
          <div className="mt-1 space-y-2">
            {message.blocks.map((block, i) => (
              <BlockRenderer key={i} block={block} />
            ))}
          </div>
        )}

        {message.ai?.contextSources &&
          message.ai.contextSources.length > 0 && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-zen-subtle">
              <IconSparkle className="h-2.5 w-2.5" />
              context: {message.ai.contextSources.join(', ')}
            </div>
          )}

        {!isThreadRoot &&
          message.threadReplyCount !== undefined &&
          message.threadReplyCount > 0 && (
            <button
              onClick={onThreadClick}
              className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-zen-accent hover:underline"
            >
              <IconThread className="h-3 w-3" />
              {message.threadReplyCount}{' '}
              {message.threadReplyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
      </div>

      {!editing && !isThreadRoot && (
        <div className="absolute top-0 right-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white border border-zen-border rounded-md shadow-zen-soft z-10">
          <ToolbarButton label="Reply in thread" onClick={onThreadClick}>
            <IconThread className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label="Quote reply" onClick={onReply}>
            <IconReply className="h-3.5 w-3.5" />
          </ToolbarButton>
          {isYou ? (
            <>
              <ToolbarButton label="Edit" onClick={startEdit}>
                <IconPencil className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton label="Delete" onClick={onDelete}>
                <IconTrash className="h-3.5 w-3.5" />
              </ToolbarButton>
            </>
          ) : (
            <>
              <ToolbarButton
                label={message.unread ? 'Mark read' : 'Mark unread'}
                onClick={onMarkUnread}
              >
                <IconCheck className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton label="Remind me in 1h" onClick={onRemind}>
                <IconBell className="h-3.5 w-3.5" />
              </ToolbarButton>
            </>
          )}
          <ToolbarButton
            label="More"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <IconMoreHorizontal className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>
      )}

      {menuOpen && (
        <div className="absolute top-5 right-4 z-20 bg-white border border-zen-border rounded-md shadow-zen-pop py-1 min-w-[160px] animate-zen-pop-in">
          <MenuItem label="Copy link" onClick={() => setMenuOpen(false)} />
          <MenuItem label="Pin to channel" onClick={() => setMenuOpen(false)} />
          {!isYou && (
            <MenuItem
              label={message.unread ? 'Mark read' : 'Mark unread'}
              onClick={onMarkUnread}
            />
          )}
          {!isYou && (
            <MenuItem label="Remind me in 1 hour" onClick={onRemind} />
          )}
          {isYou && <MenuItem label="Edit" onClick={startEdit} />}
          {isYou && <MenuItem label="Delete" onClick={onDelete} danger />}
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="h-7 w-7 flex items-center justify-center text-zen-muted hover:text-zen-ink hover:bg-zen-surface transition-colors"
    >
      {children}
    </button>
  );
}

function MenuItem({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-1.5 text-[12px] hover:bg-zen-surface transition-colors',
        danger ? 'text-red-600' : 'text-zen-ink',
      )}
    >
      {label}
    </button>
  );
}
