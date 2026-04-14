'use client';

import { useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { Avatar } from '@/components/chat/Avatar';
import {
  IconBriefcase,
  IconChevronDown,
  IconChevronRight,
  IconHash,
  IconLayers,
  IconPage,
  IconPin,
  IconPlus,
  IconRobot,
  IconUser,
  IconWhatsApp,
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { Channel } from '@/types';

import { MainColumn } from '../MainColumn';

/**
 * The Home view — Slack-like sidebar with clearly sectioned nav plus
 * the existing MainColumn as the center pane. Sections:
 *
 *  • Starred — channels marked as favourites
 *  • Channels — public and notion-mirror channels
 *  • Direct messages — 1:1 DMs and WhatsApp chats
 *  • Agents — every installed AI agent
 *  • Integrations — connected sources (Notion, HubSpot, Google)
 *
 * Every section is collapsible so a user with 80 channels can still
 * find their people, and the active state follows `activeChannelId`.
 */
export function HomeView() {
  const mode = useNodeStore((s) => s.mode);
  const toggleWorkspacePanel = useNodeStore((s) => s.toggleWorkspacePanel);
  const channels = useNodeStore(
    useShallow((s) => Object.values(s.channelsById)),
  );
  const agents = useNodeStore(
    useShallow((s) => Object.values(s.agentsById)),
  );
  const activeChannelId = useNodeStore((s) => s.activeChannelId);
  const setActiveChannel = useNodeStore((s) => s.setActiveChannel);
  const openCreateModal = useNodeStore((s) => s.openCreateModal);
  const setView = useNodeStore((s) => s.setView);

  const visibleChannels = channels.filter(
    (c) => mode === 'combined' || c.workspace === mode,
  );

  const starred = visibleChannels.filter((c) => c.starred);
  const rooms = visibleChannels.filter(
    (c) => !c.starred && (c.kind === 'channel' || c.kind === 'notion-mirror'),
  );
  const dms = visibleChannels.filter(
    (c) => !c.starred && (c.kind === 'dm' || c.kind === 'whatsapp-chat'),
  );

  const ModeIcon =
    mode === 'work' ? IconBriefcase : mode === 'personal' ? IconUser : IconLayers;
  const modeLabel =
    mode === 'work' ? 'Work' : mode === 'personal' ? 'Personal' : 'Combined';

  return (
    <>
      <aside className="w-[260px] border-r border-zen-border flex flex-col bg-zen-canvas min-h-0 flex-shrink-0">
        <button
          onClick={toggleWorkspacePanel}
          className="mx-3 mt-3 mb-2 flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-zen-surface transition-colors text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <ModeIcon className="h-3.5 w-3.5 text-zen-ink flex-shrink-0" />
            <div className="text-[14px] font-semibold text-zen-ink truncate">
              {modeLabel}
            </div>
          </div>
          <IconChevronDown className="h-3 w-3 text-zen-subtle flex-shrink-0" />
        </button>

        <div className="flex-1 overflow-y-auto min-h-0 pb-4">
          <Section
            label="Starred"
            emptyHint="Star a channel to pin it here"
            show={starred.length > 0}
          >
            <ul className="space-y-0.5">
              {starred.map((channel) => (
                <ChannelRow
                  key={channel.id}
                  channel={channel}
                  active={activeChannelId === channel.id}
                  onClick={() => setActiveChannel(channel.id)}
                  starred
                />
              ))}
            </ul>
          </Section>

          <Section
            label="Channels"
            onAdd={() => openCreateModal('new-channel')}
          >
            <ul className="space-y-0.5">
              {rooms.map((channel) => (
                <ChannelRow
                  key={channel.id}
                  channel={channel}
                  active={activeChannelId === channel.id}
                  onClick={() => setActiveChannel(channel.id)}
                />
              ))}
            </ul>
          </Section>

          <Section
            label="Direct messages"
            onAdd={() => openCreateModal('new-chat')}
          >
            <ul className="space-y-0.5">
              {dms.map((channel) => (
                <ChannelRow
                  key={channel.id}
                  channel={channel}
                  active={activeChannelId === channel.id}
                  onClick={() => setActiveChannel(channel.id)}
                />
              ))}
            </ul>
          </Section>

          <Section
            label="Agents"
            onAdd={() => setView('agents')}
          >
            <ul className="space-y-0.5">
              {agents.map((agent) => (
                <li key={agent.id}>
                  <button
                    onClick={() => setView('agents')}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-[13px] text-zen-muted hover:bg-zen-surface/60 hover:text-zen-ink transition-colors"
                  >
                    <Avatar name={agent.name} kind="agent" size="sm" />
                    <span className="truncate flex-1 text-left">
                      {agent.name}
                    </span>
                    {agent.proactive?.enabled && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => setView('agents')}
                  className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-[12px] text-zen-accent hover:bg-zen-accentSoft transition-colors"
                >
                  <IconPlus className="h-3 w-3" />
                  Browse agent marketplace
                </button>
              </li>
            </ul>
          </Section>

          <Section label="Integrations">
            <ul className="space-y-0.5">
              <IntegrationRow label="Notion" connected />
              <IntegrationRow label="HubSpot" connected />
              <IntegrationRow label="Google Workspace" />
              <IntegrationRow label="WhatsApp" connected />
            </ul>
          </Section>
        </div>
      </aside>

      <MainColumn />
    </>
  );
}

function Section({
  label,
  children,
  onAdd,
  show = true,
  emptyHint,
}: {
  label: string;
  children: React.ReactNode;
  onAdd?: () => void;
  show?: boolean;
  emptyHint?: string;
}) {
  const [open, setOpen] = useState(true);
  if (!show && !emptyHint) return null;

  return (
    <div className="mt-4 px-2">
      <div className="flex items-center justify-between group">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex-1 flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider text-zen-subtle font-semibold hover:text-zen-ink transition-colors"
        >
          {open ? (
            <IconChevronDown className="h-2.5 w-2.5" />
          ) : (
            <IconChevronRight className="h-2.5 w-2.5" />
          )}
          {label}
        </button>
        {onAdd && (
          <button
            onClick={onAdd}
            className="h-5 w-5 rounded text-zen-subtle hover:text-zen-ink hover:bg-zen-surface flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`New ${label.toLowerCase()}`}
          >
            <IconPlus className="h-3 w-3" />
          </button>
        )}
      </div>
      {open && (
        <div className="mt-1">
          {show ? (
            children
          ) : (
            <div className="px-2 py-1 text-[11px] text-zen-subtle italic">
              {emptyHint}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChannelRow({
  channel,
  active,
  onClick,
  starred,
}: {
  channel: Channel;
  active: boolean;
  onClick: () => void;
  starred?: boolean;
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
            ? 'bg-zen-ink text-white hover:bg-zen-ink'
            : 'text-zen-muted hover:bg-zen-surface/60 hover:text-zen-ink',
        )}
      >
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="truncate flex-1 text-left">{channel.name}</span>
        {starred && <IconPin className="h-3 w-3 flex-shrink-0 opacity-70" />}
        {channel.isPrivate && (
          <span className="text-[9px] uppercase tracking-wider opacity-60">
            private
          </span>
        )}
      </button>
    </li>
  );
}

function IntegrationRow({
  label,
  connected,
}: {
  label: string;
  connected?: boolean;
}) {
  return (
    <li className="flex items-center gap-2 px-2 py-1 text-[13px] text-zen-muted">
      <IconRobot className="h-3.5 w-3.5 opacity-60" />
      <span className="flex-1 truncate">{label}</span>
      <span
        className={cn(
          'text-[10px] uppercase tracking-wider',
          connected ? 'text-emerald-600' : 'text-zen-subtle',
        )}
      >
        {connected ? 'on' : 'off'}
      </span>
    </li>
  );
}
