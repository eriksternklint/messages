'use client';

import {
  IconHash,
  IconPage,
  IconSparkle,
  IconWhatsApp,
} from '@/components/icons';
import { BlockRenderer } from '@/components/chat/BlockRenderer';
import { CommandInput } from '@/components/command/CommandInput';
import { DemoActions } from '@/components/demo/DemoActions';
import { cn, formatRelative, initials } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { Channel, Message } from '@/types';

// Module-level stable empty array. Returning a fresh `[]` from a
// Zustand selector breaks React 18's `useSyncExternalStore` reference
// check and triggers "Maximum update depth exceeded" — see
// https://github.com/pmndrs/zustand/issues/1208.
const EMPTY_IDS: readonly string[] = Object.freeze([]);

/**
 * The center column — channel header, message list, and the
 * Universal Command Input. The command input is pre-filled with the
 * most recent AI-drafted response for the current channel's most
 * urgent message, so you can execute or edit-and-execute in one step.
 */
export function MainColumn() {
  const activeChannelId = useNodeStore((s) => s.activeChannelId);
  const channel = useNodeStore((s) =>
    activeChannelId ? s.channelsById[activeChannelId] : undefined,
  );
  const messagesById = useNodeStore((s) => s.messagesById);
  const messageIds = useNodeStore(
    (s) =>
      (activeChannelId && s.messageIdsByChannel[activeChannelId]) ||
      EMPTY_IDS,
  );

  if (!channel) {
    return (
      <div className="flex items-center justify-center text-zen-subtle text-sm">
        Select a channel to get started.
      </div>
    );
  }

  const messages = messageIds
    .map((id) => messagesById[id])
    .filter((m): m is Message => Boolean(m));

  const actionDraft = [...messages]
    .reverse()
    .find((m) => m.ai?.draftedResponse)?.ai?.draftedResponse;

  return (
    <div className="flex flex-col min-w-0 min-h-0">
      <ChannelHeader channel={channel} />
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {messages.length === 0 ? (
          <div className="text-center text-zen-subtle text-sm mt-20">
            No messages yet. Type below to start.
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((m) => (
              <MessageRow key={m.id} message={m} />
            ))}
          </div>
        )}
      </div>
      <div className="border-t border-zen-border px-8 py-4">
        <div className="max-w-3xl mx-auto">
          <CommandInput
            channelId={channel.id}
            initialValue={actionDraft ?? ''}
          />
        </div>
      </div>
    </div>
  );
}

function ChannelHeader({ channel }: { channel: Channel }) {
  const Icon =
    channel.kind === 'notion-mirror'
      ? IconPage
      : channel.kind === 'whatsapp-chat'
        ? IconWhatsApp
        : IconHash;
  const badge =
    channel.kind === 'notion-mirror'
      ? 'Notion mirror'
      : channel.kind === 'whatsapp-chat'
        ? 'WhatsApp'
        : 'Channel';

  return (
    <div className="border-b border-zen-border px-8 py-4 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="h-4 w-4 text-zen-muted flex-shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-medium text-zen-ink truncate">
            {channel.name}
          </div>
          {channel.description && (
            <div className="text-[11px] text-zen-subtle truncate">
              {channel.description}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-zen-subtle flex-shrink-0">
        <span className="px-2 py-0.5 rounded-full bg-zen-surface border border-zen-border">
          {badge}
        </span>
        <span>{channel.memberIds.length} members</span>
        <DemoActions channelId={channel.id} />
      </div>
    </div>
  );
}

function MessageRow({ message }: { message: Message }) {
  return (
    <div className="flex gap-3 group">
      <div className="h-8 w-8 rounded-full bg-zen-surface border border-zen-border flex items-center justify-center text-[11px] font-medium text-zen-muted flex-shrink-0">
        {initials(message.author.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[13px] font-medium text-zen-ink">
            {message.author.name}
          </span>
          {message.author.kind === 'agent' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zen-surface border border-zen-border text-zen-muted">
              {message.author.agentPersona ?? 'Agent'}
            </span>
          )}
          <span className="text-[11px] text-zen-subtle">
            {formatRelative(message.createdAt)}
          </span>
          {message.ai?.priority === 'action' && (
            <span className="text-[10px] text-zen-muted flex items-center gap-0.5">
              <IconSparkle className="h-2.5 w-2.5" />
              action
            </span>
          )}
        </div>
        <div className="mt-1 space-y-2">
          {message.blocks.map((block, i) => (
            <BlockRenderer key={i} block={block} />
          ))}
        </div>
        {message.ai?.contextSources &&
          message.ai.contextSources.length > 0 && (
            <div
              className={cn(
                'mt-1 flex items-center gap-1 text-[10px] text-zen-subtle',
              )}
            >
              <IconSparkle className="h-2.5 w-2.5" />
              context: {message.ai.contextSources.join(', ')}
            </div>
          )}
      </div>
    </div>
  );
}
