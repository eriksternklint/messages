'use client';

import { useShallow } from 'zustand/react/shallow';

import { MessageRow } from '@/components/chat/MessageRow';
import { IconAt } from '@/components/icons';
import { useNodeStore } from '@/store';

/**
 * The Mentions view — flat feed of every message in the store that
 * contains `@you` or tags the local user. Uses a simple regex match
 * against rawText for now; a richer mention index lands with the
 * server-side normalizer.
 */
export function MentionsView() {
  const messages = useNodeStore(
    useShallow((s) => Object.values(s.messagesById)),
  );
  const channelsById = useNodeStore((s) => s.channelsById);

  const mentions = messages
    .filter((m) => /@you|@everyone|@here/i.test(m.rawText))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <aside className="w-[260px] border-r border-zen-border flex flex-col bg-zen-canvas min-h-0 flex-shrink-0">
        <div className="px-4 pt-4 pb-2">
          <div className="text-[15px] font-semibold text-zen-ink">Mentions</div>
          <div className="text-[11px] text-zen-subtle mt-0.5">
            Everywhere you've been tagged.
          </div>
        </div>
        <div className="px-4 py-3 text-[11px] text-zen-subtle border-t border-zen-border mt-2">
          <div className="flex items-center gap-1.5">
            <IconAt className="h-3 w-3" />
            {mentions.length} {mentions.length === 1 ? 'mention' : 'mentions'}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col bg-zen-bg min-w-0">
        <div className="border-b border-zen-border px-8 py-4 flex-shrink-0">
          <div className="text-[15px] font-semibold text-zen-ink">
            Mentions
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {mentions.length === 0 ? (
            <div className="text-center text-zen-subtle text-sm mt-20">
              You aren't @-mentioned anywhere right now.
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-3">
              {mentions.map((m) => (
                <div key={m.id}>
                  <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-medium mb-1">
                    {channelsById[m.channelId]?.name ?? 'channel'}
                  </div>
                  <MessageRow message={m} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
