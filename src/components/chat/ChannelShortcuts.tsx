'use client';

import { useState } from 'react';

import { Avatar } from '@/components/chat/Avatar';
import {
  IconLink,
  IconLock,
  IconPage,
  IconPin,
  IconPlus,
  IconSettings,
  IconStar,
  IconTrash,
  IconUsers,
  IconX,
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { Channel, PinnedLink } from '@/types';

const EMPTY_IDS: readonly string[] = Object.freeze([]);

/**
 * Horizontal bar below the channel header that hosts pinned Notion
 * docs / drive files / figma links, plus lightweight access to
 * members, files, and channel settings. Matches the Notion-Zen feel:
 * thin, pill-shaped, zero visual noise unless content is present.
 */
export function ChannelShortcuts({ channel }: { channel: Channel }) {
  const setChannelTab = useNodeStore((s) => s.setChannelTab);
  const channelTab = useNodeStore((s) => s.channelTab);
  const upsertChannel = useNodeStore((s) => s.upsertChannel);

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
        <button
          onClick={() => setChannelTab('settings')}
          className="flex items-center gap-1 text-[11px] text-zen-subtle hover:text-zen-ink transition-colors"
        >
          <IconPin className="h-3 w-3" />
          Pin a Notion page or link
        </button>
      )}

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={() =>
            upsertChannel({ ...channel, starred: !channel.starred })
          }
          className={cn(
            'h-6 w-6 rounded-md flex items-center justify-center transition-colors',
            channel.starred
              ? 'text-amber-500 hover:bg-amber-50'
              : 'text-zen-subtle hover:text-zen-ink hover:bg-zen-surface',
          )}
          aria-label={channel.starred ? 'Unstar channel' : 'Star channel'}
          title={channel.starred ? 'Unstar channel' : 'Star channel'}
        >
          <IconStar className="h-3.5 w-3.5" />
        </button>
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
        <TabButton
          active={channelTab === 'settings'}
          onClick={() =>
            setChannelTab(channelTab === 'settings' ? null : 'settings')
          }
          icon={<IconSettings className="h-3 w-3" />}
          label="Settings"
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
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border border-zen-border text-[11px] text-zen-ink hover:bg-zen-surface hover:border-zen-strong transition-colors max-w-[240px] shadow-zen-soft"
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
          ? 'bg-zen-ink text-white border-zen-ink shadow-zen-soft'
          : 'bg-white text-zen-muted border-zen-border hover:text-zen-ink hover:border-zen-strong',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * Side panel triggered by channel tab. Renders files, members or the
 * full settings panel (privacy, pins, linked Notion tables) depending
 * on the active tab. Kept lightweight — slides in over the main column.
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
    <aside className="absolute top-0 right-0 bottom-0 w-[340px] bg-white border-l border-zen-border shadow-zen-pop z-10 flex flex-col animate-zen-fade">
      <div className="h-11 border-b border-zen-border flex items-center justify-between px-4 flex-shrink-0">
        <div className="text-[13px] font-semibold text-zen-ink capitalize">
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
              <div className="h-7 w-7 rounded-full bg-zen-surface border border-zen-border flex items-center justify-center text-zen-muted">
                <IconPlus className="h-3.5 w-3.5" />
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
                  <Avatar
                    name={name}
                    avatarUrl={person?.avatarUrl}
                    size="md"
                    online={person?.online}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-zen-ink truncate font-medium">
                      {name}
                    </div>
                    {person?.title && (
                      <div className="text-[10px] text-zen-subtle truncate">
                        {person.title}
                      </div>
                    )}
                  </div>
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

        {tab === 'settings' && <SettingsTab channel={channel} />}
      </div>
    </aside>
  );
}

function SettingsTab({ channel }: { channel: Channel }) {
  const upsertChannel = useNodeStore((s) => s.upsertChannel);
  const peopleById = useNodeStore((s) => s.peopleById);
  const openCreateModal = useNodeStore((s) => s.openCreateModal);
  const [pinLabel, setPinLabel] = useState('');
  const [pinUrl, setPinUrl] = useState('');
  const [pinAdding, setPinAdding] = useState(false);
  const [tableTitle, setTableTitle] = useState('');
  const [tableUrl, setTableUrl] = useState('');
  const [tableAdding, setTableAdding] = useState(false);

  const pins = channel.pinnedLinks ?? [];
  const tables = channel.linkedNotionTables ?? [];

  function togglePrivate() {
    upsertChannel({ ...channel, isPrivate: !channel.isPrivate });
  }

  function removePin(id: string) {
    upsertChannel({
      ...channel,
      pinnedLinks: pins.filter((p) => p.id !== id),
    });
  }

  function addPin() {
    if (!pinLabel.trim() || !pinUrl.trim()) return;
    upsertChannel({
      ...channel,
      pinnedLinks: [
        ...pins,
        {
          id: `pin:${Date.now()}`,
          label: pinLabel.trim(),
          url: pinUrl.trim(),
          kind: pinUrl.includes('notion.so') ? 'notion' : 'web',
        },
      ],
    });
    setPinLabel('');
    setPinUrl('');
    setPinAdding(false);
  }

  function removeTable(id: string) {
    upsertChannel({
      ...channel,
      linkedNotionTables: tables.filter((t) => t.id !== id),
    });
  }

  function addTable() {
    if (!tableTitle.trim() || !tableUrl.trim()) return;
    upsertChannel({
      ...channel,
      linkedNotionTables: [
        ...tables,
        {
          id: `tbl:${Date.now()}`,
          title: tableTitle.trim(),
          url: tableUrl.trim(),
          role: 'Database',
        },
      ],
    });
    setTableTitle('');
    setTableUrl('');
    setTableAdding(false);
  }

  return (
    <div className="space-y-5">
      <section>
        <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold mb-1.5">
          About
        </div>
        <div className="text-zen-ink font-medium">{channel.name}</div>
        {channel.description && (
          <div className="text-zen-muted mt-0.5">{channel.description}</div>
        )}
      </section>

      <section>
        <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold mb-1.5">
          Privacy
        </div>
        <button
          onClick={togglePrivate}
          className={cn(
            'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border transition-colors',
            channel.isPrivate
              ? 'bg-zen-ink text-white border-zen-ink'
              : 'bg-white text-zen-ink border-zen-border hover:bg-zen-surface',
          )}
        >
          <div className="flex items-center gap-2">
            <IconLock className="h-3.5 w-3.5" />
            <span className="text-[13px]">
              {channel.isPrivate ? 'Private channel' : 'Make private'}
            </span>
          </div>
          <span className="text-[10px] opacity-70">
            {channel.isPrivate ? 'ON' : 'OFF'}
          </span>
        </button>
        <div className="text-[10px] text-zen-subtle mt-1">
          Private channels are only visible to explicit members.
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold">
            People ({channel.memberIds.length})
          </div>
          <button
            onClick={() => openCreateModal('new-person')}
            className="text-[11px] text-zen-accent hover:underline"
          >
            + Add
          </button>
        </div>
        <ul className="space-y-0.5">
          {channel.memberIds.slice(0, 5).map((id) => {
            const person = peopleById[id];
            return (
              <li
                key={id}
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-zen-surface/60"
              >
                <Avatar
                  name={person?.name ?? id}
                  avatarUrl={person?.avatarUrl}
                  size="sm"
                  online={person?.online}
                />
                <span className="truncate text-zen-ink">
                  {person?.name ?? id}
                </span>
              </li>
            );
          })}
          {channel.memberIds.length > 5 && (
            <li className="text-[10px] text-zen-subtle px-2">
              + {channel.memberIds.length - 5} more
            </li>
          )}
        </ul>
      </section>

      <section>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold">
            Pinned links ({pins.length})
          </div>
          <button
            onClick={() => setPinAdding((a) => !a)}
            className="text-[11px] text-zen-accent hover:underline"
          >
            {pinAdding ? 'Cancel' : '+ Add'}
          </button>
        </div>
        {pinAdding && (
          <div className="space-y-1 mb-2">
            <input
              value={pinLabel}
              onChange={(e) => setPinLabel(e.target.value)}
              placeholder="Label"
              className="w-full text-[12px] border border-zen-border rounded-md px-2 py-1 bg-white outline-none focus:border-zen-ink/40"
            />
            <input
              value={pinUrl}
              onChange={(e) => setPinUrl(e.target.value)}
              placeholder="https://"
              className="w-full text-[12px] border border-zen-border rounded-md px-2 py-1 bg-white outline-none focus:border-zen-ink/40"
            />
            <button
              onClick={addPin}
              disabled={!pinLabel.trim() || !pinUrl.trim()}
              className={cn(
                'w-full h-7 rounded-md text-[11px] font-medium',
                pinLabel.trim() && pinUrl.trim()
                  ? 'bg-zen-accent text-white hover:bg-[#1a6fc5]'
                  : 'bg-zen-surface text-zen-subtle cursor-not-allowed',
              )}
            >
              Pin
            </button>
          </div>
        )}
        <ul className="space-y-0.5">
          {pins.map((pin) => (
            <li
              key={pin.id}
              className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-zen-surface/60 group"
            >
              <IconPin className="h-3 w-3 text-zen-subtle" />
              <a
                href={pin.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 truncate text-zen-ink hover:underline"
              >
                {pin.label}
              </a>
              <button
                onClick={() => removePin(pin.id)}
                className="opacity-0 group-hover:opacity-100 text-zen-subtle hover:text-red-600 transition-opacity"
                aria-label="Remove pin"
              >
                <IconTrash className="h-3 w-3" />
              </button>
            </li>
          ))}
          {pins.length === 0 && !pinAdding && (
            <li className="text-[11px] text-zen-subtle italic px-2 py-1">
              No pins yet.
            </li>
          )}
        </ul>
      </section>

      <section>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold">
            Linked Notion tables ({tables.length})
          </div>
          <button
            onClick={() => setTableAdding((a) => !a)}
            className="text-[11px] text-zen-accent hover:underline"
          >
            {tableAdding ? 'Cancel' : '+ Link'}
          </button>
        </div>
        {tableAdding && (
          <div className="space-y-1 mb-2">
            <input
              value={tableTitle}
              onChange={(e) => setTableTitle(e.target.value)}
              placeholder="Table name"
              className="w-full text-[12px] border border-zen-border rounded-md px-2 py-1 bg-white outline-none focus:border-zen-ink/40"
            />
            <input
              value={tableUrl}
              onChange={(e) => setTableUrl(e.target.value)}
              placeholder="Notion database URL"
              className="w-full text-[12px] border border-zen-border rounded-md px-2 py-1 bg-white outline-none focus:border-zen-ink/40"
            />
            <button
              onClick={addTable}
              disabled={!tableTitle.trim() || !tableUrl.trim()}
              className={cn(
                'w-full h-7 rounded-md text-[11px] font-medium',
                tableTitle.trim() && tableUrl.trim()
                  ? 'bg-zen-accent text-white hover:bg-[#1a6fc5]'
                  : 'bg-zen-surface text-zen-subtle cursor-not-allowed',
              )}
            >
              Link table
            </button>
          </div>
        )}
        <ul className="space-y-0.5">
          {tables.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zen-surface/60 group border border-zen-border bg-zen-canvas/50"
            >
              <IconPage className="h-3.5 w-3.5 text-zen-muted" />
              <div className="flex-1 min-w-0">
                <a
                  href={t.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zen-ink truncate block hover:underline"
                >
                  {t.title}
                </a>
                {t.role && (
                  <div className="text-[10px] text-zen-subtle truncate">
                    {t.role}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeTable(t.id)}
                className="opacity-0 group-hover:opacity-100 text-zen-subtle hover:text-red-600 transition-opacity"
                aria-label="Unlink"
              >
                <IconTrash className="h-3 w-3" />
              </button>
            </li>
          ))}
          {tables.length === 0 && !tableAdding && (
            <li className="text-[11px] text-zen-subtle italic px-2 py-1">
              No tables linked. Link a Notion database to read and write with{' '}
              <code className="px-1 bg-zen-canvas rounded">/notion-table</code>.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
