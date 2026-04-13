'use client';

import { IconLink, IconPage, IconPin, IconPlus, IconUsers, IconX } from '@/components/icons';
import { cn, initials } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { Channel, PinnedLink } from '@/types';

const EMPTY_IDS: readonly string[] = Object.freeze([]);

/**
 * Horizontal bar below the channel header that hosts pinned Notion
 * docs / drive files / figma links, plus lightweight access to
 * members and channel-level files view. Matches the Notion-Zen feel:
 * thin, pill-shaped, zero visual noise unless content is present.
 */
export function ChannelShortcuts({ channel }: { channel: Channel }) {
  const setChannelTab = useNodeStore((s) => s.setChannelTab);
  const channelTab = useNodeStore((s) => s.channelTab);

  const pins = channel.pinnedLinks ?? [];

  return (
    <div className="px-8 py-2 border-b border-zen-border flex items-center gap-2 flex-wrap flex-shrink-0 bg-zen-canvas/40">
      {pins.length > 0 ? (
        <>
          <IconPin className="h-3 w-3 text-zen-subtle" />
          {pins.map((pin) => (
            <PinChip key={pin.id} pin={pin} />
          ))}
        </>
      ) : (
        <button className="flex items-center gap-1 text-[11px] text-zen-subtle hover:text-zen-ink transition-colors">
          <IconPin className="h-3 w-3" />
          Pin a Notion page or link
        </button>
      )}

      <div className="ml-auto flex items-center gap-1">
        <TabButton
          active={channelTab === 'files'}
          onClick={() =>
            setChannelTab(channelTab === 'files' ? null : 'files')
          }
          icon={<IconLink className="h-3 w-3" />}
          label="Files"
        />
        <TabButton
          active={channelTab === 'members'}
          onClick={() =>
            setChannelTab(channelTab === 'members' ? null : 'members')
          }
          icon={<IconUsers className="h-3 w-3" />}
          label={`${channel.memberIds.length}`}
        />
      </div>
    </div>
  );
}

function PinChip({ pin }: { pin: PinnedLink }) {
  const Icon = pin.kind === 'notion' ? IconPage : IconLink;
  return (
    <a
      href={pin.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border border-zen-border text-[11px] text-zen-ink hover:bg-zen-surface transition-colors max-w-[240px]"
    >
      <Icon className="h-3 w-3 text-zen-muted flex-shrink-0" />
      <span className="truncate">{pin.label}</span>
    </a>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] transition-colors border',
        active
          ? 'bg-zen-ink text-white border-zen-ink'
          : 'bg-white text-zen-muted border-zen-border hover:text-zen-ink',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * Side panel triggered by channel tab. Renders files or members or
 * settings depending on the active tab. Kept lightweight — slides in
 * over the main column.
 */
export function ChannelTabPanel({ channel }: { channel: Channel }) {
  const tab = useNodeStore((s) => s.channelTab);
  const setChannelTab = useNodeStore((s) => s.setChannelTab);
  const peopleById = useNodeStore((s) => s.peopleById);
  const messagesById = useNodeStore((s) => s.messagesById);
  const messageIds = useNodeStore(
    (s) => s.messageIdsByChannel[channel.id] || EMPTY_IDS,
  );
  const openCreateModal = useNodeStore((s) => s.openCreateModal);

  if (!tab) return null;

  return (
    <aside className="absolute top-0 right-0 bottom-0 w-[320px] bg-white border-l border-zen-border shadow-zen-soft z-10 flex flex-col animate-zen-fade">
      <div className="h-11 border-b border-zen-border flex items-center justify-between px-4 flex-shrink-0">
        <div className="text-[13px] font-medium text-zen-ink capitalize">
          {tab}
        </div>
        <button
          onClick={() => setChannelTab(null)}
          className="h-7 w-7 rounded-md hover:bg-zen-surface flex items-center justify-center text-zen-muted"
          aria-label="Close"
        >
          <IconX className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 text-[12px]">
        {tab === 'members' && (
          <div className="space-y-1">
            <button
              onClick={() => openCreateModal('new-person')}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zen-surface text-zen-ink"
            >
              <div className="h-6 w-6 rounded-full bg-zen-surface border border-zen-border flex items-center justify-center text-zen-muted">
                <IconPlus className="h-3 w-3" />
              </div>
              Invite someone
            </button>
            {channel.memberIds.map((id) => {
              const person = peopleById[id];
              const name = person?.name ?? id;
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zen-surface/60"
                >
                  <div className="h-6 w-6 rounded-full bg-zen-surface border border-zen-border flex items-center justify-center text-[10px] text-zen-muted">
                    {initials(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-zen-ink truncate">{name}</div>
                    {person?.title && (
                      <div className="text-[10px] text-zen-subtle truncate">
                        {person.title}
                      </div>
                    )}
                  </div>
                  {person?.online && (
                    <div className="h-1.5 w-1.5 rounded-full bg-zen-success" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'files' && (
          <div className="space-y-1">
            {messageIds
              .map((id) => messagesById[id])
              .flatMap((m) =>
                (m?.blocks ?? []).filter(
                  (b) => b.type === 'file' || b.type === 'notion-page-ref',
                ),
              )
              .map((b, i) =>
                b.type === 'file' ? (
                  <a
                    key={i}
                    href={b.url}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zen-surface text-zen-ink"
                  >
                    <IconLink className="h-3 w-3 text-zen-muted" />
                    <span className="truncate">{b.name}</span>
                  </a>
                ) : (
                  <a
                    key={i}
                    href={b.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zen-surface text-zen-ink"
                  >
                    <IconPage className="h-3 w-3 text-zen-muted" />
                    <span className="truncate">{b.title}</span>
                  </a>
                ),
              )}
            <div className="text-[10px] text-zen-subtle italic px-2 py-1">
              All files shared in this channel.
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-2 text-zen-muted">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-medium mb-1">
                Name
              </div>
              <div className="text-zen-ink">{channel.name}</div>
            </div>
            {channel.description && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-medium mb-1">
                  Topic
                </div>
                <div className="text-zen-ink">{channel.description}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
