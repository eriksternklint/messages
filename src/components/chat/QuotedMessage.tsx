'use client';

import { IconReply } from '@/components/icons';
import { useNodeStore } from '@/store';

/**
 * Inline quote rendered above the input box AND inside a message bubble
 * that was sent as a WhatsApp-style reply. The left accent bar makes it
 * visually distinct from the main message body.
 */
export function QuotedMessage({
  authorName,
  preview,
  onJump,
  onDismiss,
}: {
  authorName: string;
  preview: string;
  onJump?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div
      onClick={onJump}
      className="group flex items-stretch gap-2 pl-2 pr-2 py-1 mb-1 rounded-md bg-zen-canvas border border-zen-border text-[11px] cursor-pointer hover:bg-zen-surface transition-colors"
    >
      <div className="w-0.5 rounded-full bg-zen-accent flex-shrink-0" />
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-center gap-1 text-zen-muted">
          <IconReply className="h-2.5 w-2.5" />
          <span className="font-medium">{authorName}</span>
        </div>
        <div className="text-zen-subtle line-clamp-1">{preview}</div>
      </div>
      {onDismiss && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="text-zen-subtle hover:text-zen-ink text-[10px] self-start mt-0.5"
          aria-label="Clear quote"
        >
          ×
        </button>
      )}
    </div>
  );
}

/**
 * Helper: look up the preview text for a message id. Used by the
 * input to render the currently-attached quote.
 */
export function useQuotePreview(messageId: string | null) {
  const messagesById = useNodeStore((s) => s.messagesById);
  if (!messageId) return null;
  const msg = messagesById[messageId];
  if (!msg) return null;
  return {
    messageId,
    authorName: msg.author.name,
    preview: msg.rawText.slice(0, 160),
  };
}
