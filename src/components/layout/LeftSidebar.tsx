'use client';

import { useShallow } from 'zustand/react/shallow';

import {
  IconBriefcase,
  IconChevronDown,
  IconHash,
  IconLayers,
  IconPage,
  IconPlus,
  IconUser,
  IconWhatsApp,
} from '@/components/icons';
import { PriorityFeed } from '@/components/priority-feed/PriorityFeed';
import { cn } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { Channel } from '@/types';

/**
 * Second column — the channel + priority feed sidebar. The workspace
 * switcher lives inside the WorkspacePanel drawer now; this column is
 * purely "what's in this workspace".
 */
export function LeftSidebar() {
  const mode = useNodeStore((s) => s.mode);
  const toggleWorkspacePanel = useNodeStore((s) => s.toggleWorkspacePanel);
  // `useShallow` does element-wise comparison so the new array
  // produced by Object.values doesn't trip useSyncExternalStore's
  // reference check (which would loop until React #185).
  const channels = useNodeStore(
    useShallow((s) => Object.values(s.channelsById)),
  );
  const activeChannelId = useNodeStore((s) => s.activeChannelId);
  const setActiveChannel = useNodeStore((s) => s.setActiveChannel);
  const openCreateModal = useNodeStore((s) => s.openCreateModal);

  const visibleChannels = channels.filter(
    (c) => mode === 'combined' || c.workspace === mode,
  );

  const ModeIcon =
    mode === 'work' ? IconBriefcase : mode === 'personal' ? IconUser : IconLayers;
  const modeLabel =
    mode === 'work' ? 'Work' : mode === 'personal' ? 'Personal' : 'Combined';

  const dms = visibleChannels.filter(
    (c) => c.kind === 'dm' || c.kind === 'whatsapp-chat',
  );
  const rooms = visibleChannels.filter(
    (c) => c.kind === 'channel' || c.kind === 'notion-mirror',
  );

  return (
    <aside className="border-r border-zen-border flex flex-col bg-zen-canvas min-h-0">
      <button
        onClick={toggleWorkspacePanel}
        className="mx-3 mt-3 mb-2 flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-zen-surface transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ModeIcon className="h-3.5 w-3.5 text-zen-muted flex-shrink-0" />
          <div className="text-[13px] font-semibold text-zen-ink truncate">
            {modeLabel}
          </div>
        </div>
        <IconChevronDown className="h-3 w-3 text-zen-subtle flex-shrink-0" />
      </button>

      <div className="flex-1 overflow-y-auto min-h-0">
        <PriorityFeed />

        <SectionHeader
          label="Channels"
          onAdd={() => openCreateModal('new-channel')}
        />
        <ul className="px-2 space-y-0.5">
          {rooms.map((channel) => (
            <ChannelRow
              key={channel.id}
              channel={channel}
              active={activeChannelId === channel.id}
              onClick={() => setActiveChannel(channel.id)}
            />
          ))}
        </ul>

        {dms.length > 0 && (
          <>
            <SectionHeader
              label="Direct messages"
              onAdd={() => openCreateModal('new-chat')}
            />
            <ul className="px-2 space-y-0.5 pb-4">
              {dms.map((channel) => (
                <ChannelRow
                  key={channel.id}
                  channel={channel}
                  active={activeChannelId === channel.id}
                  onClick={() => setActiveChannel(channel.id)}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </aside>
  );
}

function SectionHeader({
  label,
  onAdd,
}: {
  label: string;
  onAdd?: () => void;
}) {
  return (
    <div className="px-4 pt-5 pb-1 flex items-center justify-between group">
      <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-medium">
        {label}
      </div>
      {onAdd && (
        <button
          onClick={onAdd}
          className="h-4 w-4 rounded text-zen-subtle hover:text-zen-ink hover:bg-zen-surface flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={`New ${label.toLowerCase()}`}
        >
          <IconPlus className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
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
          'w-full flex items-center gap-2 px-2 py-1 rounded-md text-[13px] transition-colors',
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
