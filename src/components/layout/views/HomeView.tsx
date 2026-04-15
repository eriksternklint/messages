'use client';

import { useMemo, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { Avatar } from '@/components/chat/Avatar';
import {
  IconBriefcase,
  IconChevronDown,
  IconChevronRight,
  IconHash,
  IconLayers,
  IconPage,
  IconPencil,
  IconPin,
  IconPlus,
  IconRobot,
  IconUser,
  IconUsers,
  IconWhatsApp,
} from '@/components/icons';
import { dispatch } from '@/lib/events';
import { cn } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { Agent, Channel, Message } from '@/types';

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
  const messagesById = useNodeStore((s) => s.messagesById);
  const messageIdsByChannel = useNodeStore((s) => s.messageIdsByChannel);
  const activeChannelId = useNodeStore((s) => s.activeChannelId);
  const setActiveChannel = useNodeStore((s) => s.setActiveChannel);
  const openCreateModal = useNodeStore((s) => s.openCreateModal);
  const setView = useNodeStore((s) => s.setView);
  const setStartChatOpen = useNodeStore((s) => s.setStartChatOpen);
  const setInviteModalOpen = useNodeStore((s) => s.setInviteModalOpen);
  const upsertChannel = useNodeStore((s) => s.upsertChannel);
  const channelsById = useNodeStore((s) => s.channelsById);

  const visibleChannels = channels.filter(
    (c) => mode === 'combined' || c.workspace === mode,
  );

  // Count unread messages per channel so the sidebar can show a Slack-y
  // badge/bold-weight treatment on rows that need attention.
  const unreadByChannel = useMemo(() => {
    const out: Record<string, number> = {};
    for (const cid of Object.keys(messageIdsByChannel)) {
      let n = 0;
      for (const id of messageIdsByChannel[cid] ?? []) {
        const m = messagesById[id];
        if (m?.unread) n++;
      }
      if (n > 0) out[cid] = n;
    }
    return out;
  }, [messagesById, messageIdsByChannel]);

  function openAgentDM(agent: Agent) {
    // Find or create a DM channel with this agent.
    const existing = Object.values(channelsById).find(
      (c) =>
        c.kind === 'dm' &&
        c.memberIds.length === 2 &&
        c.memberIds.includes('u:you') &&
        c.memberIds.includes(agent.id),
    );
    if (existing) {
      setActiveChannel(existing.id);
      return;
    }
    const channel: Channel = {
      id: `dm:${agent.id}`,
      kind: 'dm',
      name: agent.name,
      workspace: 'work',
      memberIds: ['u:you', agent.id],
      agentIds: [agent.id],
      lastMessageAt: new Date().toISOString(),
    };
    upsertChannel(channel);
    const intro: Message = {
      id: `local:agent-intro-${Date.now()}`,
      source: 'system',
      channelId: channel.id,
      author: { id: agent.id, name: agent.name, kind: 'agent' },
      createdAt: new Date().toISOString(),
      blocks: [
        {
          type: 'markdown',
          content: `Hi — I'm **${agent.name}**. ${agent.persona} Ask me anything or hand me a task.`,
        },
      ],
      rawText: `Hi — I'm ${agent.name}. ${agent.persona}`,
    };
    dispatch({ kind: 'message.created', message: intro });
    setActiveChannel(channel.id);
  }

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
          className="mx-2 mt-2 mb-2 flex items-center justify-between gap-2 px-2 py-2 rounded-md hover:bg-zen-surface transition-colors text-left group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-md bg-zen-ink text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
              N
            </div>
            <div className="flex flex-col min-w-0">
              <div className="text-[14px] font-bold text-zen-ink truncate tracking-tight leading-none">
                Node
              </div>
              <div className="text-[10px] text-zen-subtle truncate leading-tight flex items-center gap-1 mt-0.5">
                <ModeIcon className="h-2.5 w-2.5" />
                {modeLabel}
              </div>
            </div>
          </div>
          <IconChevronDown className="h-3 w-3 text-zen-subtle flex-shrink-0 group-hover:text-zen-ink transition-colors" />
        </button>

        <div className="px-3 space-y-1.5">
          <button
            onClick={() => setStartChatOpen(true)}
            className="w-full h-8 flex items-center gap-2 px-2.5 rounded-md bg-zen-ink text-white text-[12px] font-medium hover:bg-zen-accent transition-colors shadow-zen-soft"
          >
            <IconPencil className="h-3 w-3" />
            <span className="flex-1 text-left">Start a chat</span>
            <kbd className="text-[9px] bg-white/15 rounded px-1 py-0.5 font-sans">
              ⌘N
            </kbd>
          </button>
          <button
            onClick={() => setInviteModalOpen(true)}
            className="w-full h-8 flex items-center gap-2 px-2.5 rounded-md border border-zen-border bg-white text-[12px] font-medium text-zen-ink hover:bg-zen-canvas hover:border-zen-ink/40 transition-colors"
          >
            <IconUsers className="h-3 w-3 text-zen-muted" />
            <span className="flex-1 text-left">Invite teammates</span>
          </button>
        </div>

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
                  unread={unreadByChannel[channel.id] ?? 0}
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
                  unread={unreadByChannel[channel.id] ?? 0}
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
                  unread={unreadByChannel[channel.id] ?? 0}
                />
              ))}
            </ul>
          </Section>

          <Section
            label="Agents"
            onAdd={() => setView('agents')}
          >
            <ul className="space-y-0.5">
              {agents.map((agent) => {
                const dmId = `dm:${agent.id}`;
                const isActive = activeChannelId === dmId;
                return (
                  <li key={agent.id}>
                    <button
                      onClick={() => openAgentDM(agent)}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1 rounded-md text-[13px] transition-colors',
                        isActive
                          ? 'bg-zen-ink text-white hover:bg-zen-ink'
                          : 'text-zen-muted hover:bg-zen-surface/60 hover:text-zen-ink',
                      )}
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
                );
              })}
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
  unread,
}: {
  channel: Channel;
  active: boolean;
  onClick: () => void;
  starred?: boolean;
  unread?: number;
}) {
  const Icon =
    channel.kind === 'notion-mirror'
      ? IconPage
      : channel.kind === 'whatsapp-chat'
        ? IconWhatsApp
        : IconHash;
  const hasUnread = !active && (unread ?? 0) > 0;

  return (
    <li className="relative">
      {/* Slack-y left indicator bar when active. */}
      {active && (
        <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r bg-zen-accent" />
      )}
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-2 pl-2.5 pr-2 py-1 rounded-md text-[13px] transition-colors',
          active
            ? 'bg-zen-ink text-white hover:bg-zen-ink font-semibold'
            : hasUnread
              ? 'text-zen-ink font-semibold hover:bg-zen-surface/60'
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
        {hasUnread && (
          <span className="h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-semibold flex items-center justify-center flex-shrink-0">
            {unread! > 99 ? '99+' : unread}
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
