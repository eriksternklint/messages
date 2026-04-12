'use client';

import {
  IconBell,
  IconClock,
  IconLayers,
  IconSparkle,
} from '@/components/icons';
import { formatRelative } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { Message, PriorityBucket } from '@/types';

/**
 * The Priority Feed replaces the traditional unread-dot-based channel
 * list. Every message is sorted by the AI Orchestration Layer into one
 * of four buckets; the user's focus is directed at "Action Required"
 * first, then Waiting, then FYI, then Noise.
 */
const BUCKETS: Array<{
  id: PriorityBucket;
  label: string;
  empty: string;
  Icon: typeof IconSparkle;
}> = [
  {
    id: 'action',
    label: 'Action Required',
    empty: 'Nothing needs your input.',
    Icon: IconSparkle,
  },
  {
    id: 'waiting',
    label: 'Waiting',
    empty: 'No open loops.',
    Icon: IconClock,
  },
  { id: 'fyi', label: 'FYI', empty: 'All caught up.', Icon: IconBell },
  { id: 'noise', label: 'Noise', empty: '—', Icon: IconLayers },
];

export function PriorityFeed() {
  const feed = useNodeStore((s) => s.feed);
  const messagesById = useNodeStore((s) => s.messagesById);
  const setActiveChannel = useNodeStore((s) => s.setActiveChannel);

  return (
    <div className="px-2 pt-3">
      <div className="px-2 pb-1.5 text-[10px] uppercase tracking-wider text-zen-subtle font-medium">
        Attention Needed
      </div>

      <div className="space-y-4">
        {BUCKETS.map(({ id, label, empty, Icon }) => {
          const ids = feed[id];
          return (
            <div key={id}>
              <div className="px-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[12px] text-zen-ink font-medium">
                  <Icon className="h-3 w-3 text-zen-muted" />
                  {label}
                </div>
                <span className="text-[10px] text-zen-subtle tabular-nums">
                  {ids.length}
                </span>
              </div>
              {ids.length === 0 ? (
                <div className="px-2 pt-0.5 text-[11px] text-zen-subtle italic">
                  {empty}
                </div>
              ) : (
                <ul className="mt-1 space-y-0.5">
                  {ids.slice(0, 4).map((mid) => {
                    const msg = messagesById[mid];
                    if (!msg) return null;
                    return (
                      <FeedItem
                        key={mid}
                        message={msg}
                        onClick={() => setActiveChannel(msg.channelId)}
                      />
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FeedItem({
  message,
  onClick,
}: {
  message: Message;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className="w-full text-left px-2 py-1.5 rounded-md hover:bg-zen-surface/60 transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] text-zen-ink font-medium truncate">
            {message.author.name}
          </span>
          <span className="text-[10px] text-zen-subtle tabular-nums flex-shrink-0">
            {formatRelative(message.createdAt)}
          </span>
        </div>
        <div className="text-[11px] text-zen-muted line-clamp-1 mt-0.5">
          {message.rawText}
        </div>
      </button>
    </li>
  );
}
