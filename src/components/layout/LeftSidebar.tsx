'use client';

import {
  IconBriefcase,
  IconHash,
  IconLayers,
  IconPage,
  IconUser,
  IconWhatsApp,
} from '@/components/icons';
import { PriorityFeed } from '@/components/priority-feed/PriorityFeed';
import { cn } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { Channel, WorkspaceMode } from '@/types';

const WORKSPACES: Array<{
  id: WorkspaceMode;
  label: string;
  Icon: typeof IconBriefcase;
}> = [
  { id: 'work', label: 'Work', Icon: IconBriefcase },
  { id: 'personal', label: 'Personal', Icon: IconUser },
  { id: 'combined', label: 'Combined', Icon: IconLayers },
];

export function LeftSidebar() {
  const mode = useNodeStore((s) => s.mode);
  const setMode = useNodeStore((s) => s.setMode);
  const channels = useNodeStore((s) => Object.values(s.channelsById));
  const activeChannelId = useNodeStore((s) => s.activeChannelId);
  const setActiveChannel = useNodeStore((s) => s.setActiveChannel);

  const visibleChannels = channels.filter(
    (c) => mode === 'combined' || c.workspace === mode,
  );

  return (
    <aside className="border-r border-zen-border flex flex-col bg-zen-bg min-h-0">
      <div className="px-4 pt-5 pb-3">
        <div className="text-zen-ink text-sm font-semibold tracking-tight mb-4">
          Node
        </div>
        <div className="flex items-center gap-1 bg-zen-surface border border-zen-border rounded-md p-0.5">
          {WORKSPACES.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1 text-[11px] py-1.5 rounded transition-colors',
                mode === id
                  ? 'bg-white text-zen-ink shadow-sm'
                  : 'text-zen-muted hover:text-zen-ink',
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <PriorityFeed />

        <div className="px-2 pt-5 pb-3">
          <div className="px-2 pb-1.5 text-[10px] uppercase tracking-wider text-zen-subtle font-medium">
            Channels
          </div>
          <ul className="space-y-0.5">
            {visibleChannels.map((channel) => (
              <ChannelRow
                key={channel.id}
                channel={channel}
                active={activeChannelId === channel.id}
                onClick={() => setActiveChannel(channel.id)}
              />
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}

function ChannelRow({
  channel,
  active,
  onClick,
}: {
  channel: Channel;
  active: boolean;
  onClick: () => void;
}) {
  const Icon =
    channel.kind === 'notion-mirror'
      ? IconPage
      : channel.kind === 'whatsapp-chat'
        ? IconWhatsApp
        : IconHash;

  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] transition-colors',
          active
            ? 'bg-zen-surface text-zen-ink'
            : 'text-zen-muted hover:bg-zen-surface/60 hover:text-zen-ink',
        )}
      >
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="truncate">{channel.name}</span>
      </button>
    </li>
  );
}
