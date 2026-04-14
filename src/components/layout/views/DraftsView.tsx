'use client';

import { useShallow } from 'zustand/react/shallow';

import { IconPencil, IconSparkle } from '@/components/icons';
import { cn, formatRelative } from '@/lib/utils';
import { useNodeStore } from '@/store';

/**
 * The Drafts view lists every message in the store that has an AI
 * draft attached and isn't yet authored by the user. Clicking a draft
 * jumps to the source channel so the pre-filled composer is ready.
 */
export function DraftsView() {
  const messages = useNodeStore(
    useShallow((s) => Object.values(s.messagesById)),
  );
  const channelsById = useNodeStore((s) => s.channelsById);
  const setActiveChannel = useNodeStore((s) => s.setActiveChannel);
  const setView = useNodeStore((s) => s.setView);

  const drafts = messages
    .filter((m) => m.ai?.draftedResponse && m.author.id !== 'u:you')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <aside className="w-[260px] border-r border-zen-border flex flex-col bg-zen-canvas min-h-0 flex-shrink-0">
        <div className="px-4 pt-4 pb-2">
          <div className="text-[15px] font-semibold text-zen-ink">Drafts</div>
          <div className="text-[11px] text-zen-subtle mt-0.5">
            AI-prepared replies waiting on your approval.
          </div>
        </div>
        <div className="px-4 py-3 text-[11px] text-zen-subtle border-t border-zen-border mt-2">
          <div className="flex items-center gap-1.5">
            <IconPencil className="h-3 w-3" />
            {drafts.length} pending
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col bg-zen-bg min-w-0">
        <div className="border-b border-zen-border px-8 py-4 flex-shrink-0">
          <div className="text-[15px] font-semibold text-zen-ink">
            AI drafts
          </div>
          <div className="text-[11px] text-zen-subtle">
            Open a draft to review, edit, or send with one click.
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {drafts.length === 0 ? (
            <div className="text-center text-zen-subtle text-sm mt-20">
              No pending drafts — you're caught up.
            </div>
          ) : (
            <ul className="max-w-3xl mx-auto space-y-2">
              {drafts.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => {
                      setActiveChannel(m.channelId);
                      setView('home');
                    }}
                    className={cn(
                      'w-full text-left p-4 rounded-md border border-zen-border',
                      'hover:bg-zen-canvas/70 hover:border-zen-strong transition-colors',
                    )}
                  >
                    <div className="flex items-center gap-2 text-[11px] text-zen-subtle mb-2">
                      <span className="font-medium text-zen-muted">
                        {channelsById[m.channelId]?.name ?? 'channel'}
                      </span>
                      <span>·</span>
                      <span>{m.author.name}</span>
                      <span className="ml-auto">
                        {formatRelative(m.createdAt)}
                      </span>
                    </div>
                    <div className="text-[12px] text-zen-muted italic line-clamp-2 mb-3">
                      “{m.rawText}”
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-md bg-zen-accentSoft/50 border border-zen-accent/20">
                      <IconSparkle className="h-3 w-3 text-zen-accent mt-0.5 flex-shrink-0" />
                      <div className="text-[13px] text-zen-ink italic">
                        {m.ai?.draftedResponse}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
