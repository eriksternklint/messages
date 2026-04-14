'use client';

import { useEffect, useMemo, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { Avatar } from '@/components/chat/Avatar';
import {
  IconHash,
  IconPage,
  IconRobot,
  IconSearch,
  IconSparkle,
  IconUser,
  IconX,
} from '@/components/icons';
import { dispatch } from '@/lib/events';
import { MARKETPLACE, type MarketplaceListing } from '@/lib/agents/marketplace';
import { cn } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { Agent, Channel, Message, Person } from '@/types';

/**
 * The Start Chat omnibox. Centered floating modal — the user picks one
 * or more recipients, optionally promotes the result to a channel, and
 * lands directly inside it ready to type the first message.
 *
 * Recipients can be people OR agents. The picker dedupes against
 * existing DMs and channels so the user never accidentally creates a
 * duplicate of a conversation they already have open.
 *
 * Two-step flow:
 *   1. Pick recipients
 *   2. (channel only) Name the channel + optionally link a Notion table
 */

type Pick =
  | { kind: 'person'; person: Person }
  | { kind: 'agent'; agent: Agent }
  | { kind: 'marketplace-agent'; listing: MarketplaceListing };

type ChatMode = 'dm' | 'channel';

export function StartChatModal() {
  const open = useNodeStore((s) => s.startChatOpen);
  const setOpen = useNodeStore((s) => s.setStartChatOpen);
  const peopleById = useNodeStore(useShallow((s) => s.peopleById));
  const channelsById = useNodeStore(useShallow((s) => s.channelsById));
  const agentsById = useNodeStore(useShallow((s) => s.agentsById));
  const upsertChannel = useNodeStore((s) => s.upsertChannel);
  const setActiveChannel = useNodeStore((s) => s.setActiveChannel);
  const setView = useNodeStore((s) => s.setView);
  const registerAgent = useNodeStore((s) => s.registerAgent);

  const [query, setQuery] = useState('');
  const [picks, setPicks] = useState<Pick[]>([]);
  const [mode, setMode] = useState<ChatMode>('dm');
  const [step, setStep] = useState<1 | 2>(1);
  const [channelName, setChannelName] = useState('');
  const [linkedTableUrl, setLinkedTableUrl] = useState('');

  // Reset on open/close.
  useEffect(() => {
    if (open) {
      setQuery('');
      setPicks([]);
      setMode('dm');
      setStep(1);
      setChannelName('');
      setLinkedTableUrl('');
    }
  }, [open]);

  // Single picks are always DMs. Multi picks default to channel.
  useEffect(() => {
    if (picks.length <= 1) setMode('dm');
    else if (mode === 'dm') setMode('channel');
  }, [picks.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Esc closes; Enter creates.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  // Global Cmd+N / Ctrl+N opens the modal.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  const people = useMemo(
    () =>
      Object.values(peopleById).filter(
        (p) => p.id !== 'u:you' && p.id.startsWith('u:'),
      ),
    [peopleById],
  );
  const agents = useMemo(() => Object.values(agentsById), [agentsById]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const peopleMatches = people
      .filter((p) => {
        if (picks.some((x) => x.kind === 'person' && x.person.id === p.id)) {
          return false;
        }
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          (p.title?.toLowerCase().includes(q) ?? false) ||
          (p.team?.toLowerCase().includes(q) ?? false)
        );
      })
      .slice(0, q ? 30 : 8);

    const agentMatches = agents
      .filter((a) => {
        if (picks.some((x) => x.kind === 'agent' && x.agent.id === a.id)) {
          return false;
        }
        if (!q) return true;
        return (
          a.name.toLowerCase().includes(q) ||
          a.persona.toLowerCase().includes(q)
        );
      })
      .slice(0, 6);

    const marketplaceMatches = MARKETPLACE.filter((m) => {
      // Already installed → handled in agentMatches
      if (
        Object.values(agentsById).some(
          (a) => a.marketplace?.listingId === m.id,
        )
      ) {
        return false;
      }
      if (
        picks.some(
          (x) => x.kind === 'marketplace-agent' && x.listing.id === m.id,
        )
      ) {
        return false;
      }
      if (!q) return false; // only surface when searching
      return (
        m.name.toLowerCase().includes(q) ||
        m.tagline.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      );
    }).slice(0, 4);

    return { people: peopleMatches, agents: agentMatches, marketplace: marketplaceMatches };
  }, [people, agents, agentsById, picks, query]);

  // Suggest existing chats with the current pick set.
  const existingChats = useMemo(() => {
    const wantedIds = picks
      .map((p) => {
        if (p.kind === 'person') return p.person.id;
        if (p.kind === 'agent') return p.agent.id;
        return null;
      })
      .filter((x): x is string => Boolean(x))
      .sort();
    if (wantedIds.length === 0) return [];
    return Object.values(channelsById).filter((c) => {
      const memberSet = c.memberIds.filter((id) => id !== 'u:you').sort();
      if (memberSet.length !== wantedIds.length) return false;
      return memberSet.every((id, i) => id === wantedIds[i]);
    });
  }, [picks, channelsById]);

  function addPick(pick: Pick) {
    setPicks((prev) => [...prev, pick]);
    setQuery('');
  }

  function removePick(idx: number) {
    setPicks((prev) => prev.filter((_, i) => i !== idx));
  }

  function openExistingChat(channel: Channel) {
    setActiveChannel(channel.id);
    setView('home');
    setOpen(false);
  }

  function ensureAgentInstalled(listing: MarketplaceListing): Agent {
    const existing = agents.find(
      (a) => a.marketplace?.listingId === listing.id,
    );
    if (existing) return existing;
    const agent: Agent = {
      id: `agent:${listing.id.replace('mkt:', '')}-${Date.now()}`,
      name: listing.name,
      persona: listing.tagline,
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      systemPrompt: listing.description,
      tools: listing.tools,
      workspaceIds: ['ws:work'],
      channelIds: [],
      marketplace: {
        listingId: listing.id,
        publisher: listing.publisher,
        version: listing.version,
      },
      installedAt: new Date().toISOString(),
    };
    registerAgent(agent);
    return agent;
  }

  function buildMemberIds(): { ids: string[]; agentIds: string[] } {
    const ids: string[] = ['u:you'];
    const agentIds: string[] = [];
    for (const p of picks) {
      if (p.kind === 'person') ids.push(p.person.id);
      else if (p.kind === 'agent') {
        ids.push(p.agent.id);
        agentIds.push(p.agent.id);
      } else {
        const a = ensureAgentInstalled(p.listing);
        ids.push(a.id);
        agentIds.push(a.id);
      }
    }
    return { ids, agentIds };
  }

  function handleNext() {
    if (picks.length === 0) return;
    if (mode === 'dm') {
      // Reuse existing DM if it's already open.
      if (existingChats.length > 0) {
        openExistingChat(existingChats[0]);
        return;
      }
      const { ids, agentIds } = buildMemberIds();
      const otherName =
        picks
          .map((p) =>
            p.kind === 'person'
              ? p.person.name
              : p.kind === 'agent'
                ? p.agent.name
                : p.listing.name,
          )
          .join(', ');
      const channel: Channel = {
        id: `dm:${Date.now()}`,
        kind: 'dm',
        name: otherName,
        workspace: 'work',
        memberIds: ids,
        agentIds: agentIds.length > 0 ? agentIds : undefined,
        lastMessageAt: new Date().toISOString(),
      };
      upsertChannel(channel);
      setActiveChannel(channel.id);
      setView('home');
      setOpen(false);
    } else {
      // Channel mode → step 2 for naming.
      setStep(2);
    }
  }

  function handleCreateChannel() {
    const name = channelName.trim();
    if (!name) return;
    const { ids, agentIds } = buildMemberIds();
    const channel: Channel = {
      id: `ch:${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
      kind: 'channel',
      name,
      workspace: 'work',
      memberIds: ids,
      agentIds: agentIds.length > 0 ? agentIds : undefined,
      lastMessageAt: new Date().toISOString(),
      linkedNotionTables: linkedTableUrl.trim()
        ? [
            {
              id: `lnt:${Date.now()}`,
              title: linkedTableUrl
                .replace(/^https?:\/\/(www\.)?notion\.so\//, '')
                .slice(0, 40),
              url: linkedTableUrl.trim(),
              role: 'Linked',
            },
          ]
        : undefined,
    };
    upsertChannel(channel);
    // Drop a system intro message so the channel isn't empty.
    const intro: Message = {
      id: `local:intro-${Date.now()}`,
      source: 'system',
      channelId: channel.id,
      author: { id: 'system', name: 'Node', kind: 'system' },
      createdAt: new Date().toISOString(),
      blocks: [
        {
          type: 'markdown',
          content: `**#${channel.name}** created with ${picks.length + 1} members. Drop the first message below.`,
        },
      ],
      rawText: `${channel.name} created.`,
    };
    dispatch({ kind: 'message.created', message: intro });
    setActiveChannel(channel.id);
    setView('home');
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-zen-ink/40 animate-zen-fade pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-[640px] max-w-[95vw] bg-white rounded-xl shadow-zen-pop border border-zen-border flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="h-12 px-4 border-b border-zen-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <IconSparkle className="h-3.5 w-3.5 text-zen-accent" />
            <div className="text-[13px] font-semibold text-zen-ink">
              {step === 1 ? 'Start a conversation' : `Name your ${mode === 'channel' ? 'channel' : 'chat'}`}
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="h-7 w-7 rounded-md hover:bg-zen-surface flex items-center justify-center text-zen-muted"
            aria-label="Close"
          >
            <IconX className="h-3.5 w-3.5" />
          </button>
        </header>

        {step === 1 ? (
          <>
            <div className="px-4 pt-3 pb-2">
              <div className="min-h-[40px] flex flex-wrap items-center gap-1.5 px-2 py-1.5 rounded-md border border-zen-border bg-white focus-within:border-zen-ink/40">
                {picks.map((p, i) => (
                  <PickChip
                    key={i}
                    pick={p}
                    onRemove={() => removePick(i)}
                  />
                ))}
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    picks.length === 0
                      ? 'Type a name, title, or team…'
                      : 'Add another…'
                  }
                  className="flex-1 min-w-[180px] bg-transparent text-[13px] text-zen-ink placeholder:text-zen-subtle outline-none px-1 py-0.5"
                />
              </div>
              {picks.length >= 2 && (
                <div className="flex items-center gap-2 mt-2 text-[11px]">
                  <ModeToggle
                    label="Direct message"
                    active={mode === 'dm'}
                    onClick={() => setMode('dm')}
                  />
                  <ModeToggle
                    label="Channel"
                    active={mode === 'channel'}
                    onClick={() => setMode('channel')}
                  />
                </div>
              )}
            </div>

            {existingChats.length > 0 && (
              <div className="px-4 pb-2">
                <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold mb-1">
                  Already open
                </div>
                <div className="space-y-1">
                  {existingChats.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => openExistingChat(c)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-zen-accentSoft/40 border border-zen-accent/30 hover:bg-zen-accentSoft text-left"
                    >
                      {c.kind === 'channel' ? (
                        <IconHash className="h-3.5 w-3.5 text-zen-ink" />
                      ) : (
                        <IconUser className="h-3.5 w-3.5 text-zen-ink" />
                      )}
                      <span className="text-[12px] text-zen-ink truncate flex-1">
                        {c.name}
                      </span>
                      <span className="text-[10px] text-zen-subtle uppercase tracking-wider">
                        Open
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="px-4 pb-3 max-h-[400px] overflow-y-auto">
              {suggestions.people.length > 0 && (
                <SuggestionGroup label="People">
                  {suggestions.people.map((p) => (
                    <SuggestionRow
                      key={p.id}
                      onClick={() => addPick({ kind: 'person', person: p })}
                    >
                      <Avatar
                        name={p.name}
                        avatarUrl={p.avatarUrl}
                        size="sm"
                        online={p.online}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] text-zen-ink truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-zen-subtle truncate">
                          {p.title} · {p.team}
                        </div>
                      </div>
                    </SuggestionRow>
                  ))}
                </SuggestionGroup>
              )}
              {suggestions.agents.length > 0 && (
                <SuggestionGroup label="Your agents">
                  {suggestions.agents.map((a) => (
                    <SuggestionRow
                      key={a.id}
                      onClick={() => addPick({ kind: 'agent', agent: a })}
                    >
                      <Avatar name={a.name} kind="agent" size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] text-zen-ink truncate">
                          {a.name}
                        </div>
                        <div className="text-[10px] text-zen-subtle truncate">
                          {a.persona}
                        </div>
                      </div>
                    </SuggestionRow>
                  ))}
                </SuggestionGroup>
              )}
              {suggestions.marketplace.length > 0 && (
                <SuggestionGroup label="From the marketplace">
                  {suggestions.marketplace.map((m) => (
                    <SuggestionRow
                      key={m.id}
                      onClick={() =>
                        addPick({ kind: 'marketplace-agent', listing: m })
                      }
                    >
                      <Avatar name={m.name} kind="agent" size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] text-zen-ink truncate">
                          {m.name}
                        </div>
                        <div className="text-[10px] text-zen-subtle truncate">
                          {m.tagline}
                        </div>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-zen-accent font-semibold">
                        Install
                      </span>
                    </SuggestionRow>
                  ))}
                </SuggestionGroup>
              )}
            </div>

            <footer className="border-t border-zen-border px-4 py-2.5 flex items-center justify-between flex-shrink-0">
              <div className="text-[10px] text-zen-subtle">
                {picks.length === 0
                  ? 'Pick at least one recipient'
                  : picks.length === 1
                    ? 'Press Continue to open a DM'
                    : `${picks.length} picked · ${mode === 'dm' ? 'group DM' : 'will create a channel'}`}
              </div>
              <button
                onClick={handleNext}
                disabled={picks.length === 0}
                className={cn(
                  'h-7 px-3 rounded-md text-[12px] font-medium transition-colors',
                  picks.length > 0
                    ? 'bg-zen-ink text-white hover:bg-zen-accent'
                    : 'bg-zen-surface text-zen-subtle cursor-not-allowed',
                )}
              >
                {mode === 'channel' ? 'Next' : 'Continue'}
              </button>
            </footer>
          </>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold flex items-center gap-1">
                <IconHash className="h-3 w-3" /> Channel name
              </label>
              <input
                autoFocus
                value={channelName}
                onChange={(e) =>
                  setChannelName(e.target.value.replace(/\s+/g, '-').toLowerCase())
                }
                placeholder="growth-experiments"
                className="mt-1 w-full h-9 px-3 rounded-md border border-zen-border bg-white text-[13px] text-zen-ink placeholder:text-zen-subtle outline-none focus:border-zen-ink/40"
              />
              <div className="text-[10px] text-zen-subtle mt-1">
                Lowercase, hyphens for spaces — Slack-style.
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold flex items-center gap-1">
                <IconPage className="h-3 w-3" /> Link a Notion table (optional)
              </label>
              <input
                value={linkedTableUrl}
                onChange={(e) => setLinkedTableUrl(e.target.value)}
                placeholder="https://www.notion.so/your-table"
                className="mt-1 w-full h-9 px-3 rounded-md border border-zen-border bg-white text-[13px] text-zen-ink placeholder:text-zen-subtle outline-none focus:border-zen-ink/40"
              />
              <div className="text-[10px] text-zen-subtle mt-1">
                The channel will mirror this table — collaborate on rows
                without leaving the chat.
              </div>
            </div>
            <div className="text-[11px] text-zen-muted">
              Members: you,{' '}
              {picks
                .map((p) =>
                  p.kind === 'person'
                    ? p.person.name
                    : p.kind === 'agent'
                      ? p.agent.name
                      : p.listing.name,
                )
                .join(', ')}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-zen-border">
              <button
                onClick={() => setStep(1)}
                className="text-[12px] text-zen-muted hover:text-zen-ink"
              >
                ← Back
              </button>
              <button
                onClick={handleCreateChannel}
                disabled={!channelName.trim()}
                className={cn(
                  'h-7 px-3 rounded-md text-[12px] font-medium transition-colors',
                  channelName.trim()
                    ? 'bg-zen-ink text-white hover:bg-zen-accent'
                    : 'bg-zen-surface text-zen-subtle cursor-not-allowed',
                )}
              >
                Create channel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PickChip({ pick, onRemove }: { pick: Pick; onRemove: () => void }) {
  const name =
    pick.kind === 'person'
      ? pick.person.name
      : pick.kind === 'agent'
        ? pick.agent.name
        : pick.listing.name;
  const isAgent = pick.kind !== 'person';
  return (
    <span className="inline-flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-md bg-zen-canvas border border-zen-border text-[11px] text-zen-ink">
      {isAgent ? (
        <IconRobot className="h-3 w-3 text-zen-accent" />
      ) : (
        <Avatar
          name={name}
          avatarUrl={
            pick.kind === 'person' ? pick.person.avatarUrl : undefined
          }
          size="sm"
        />
      )}
      <span className="truncate max-w-[140px]">{name}</span>
      <button
        onClick={onRemove}
        className="h-3.5 w-3.5 rounded hover:bg-zen-surface text-zen-subtle hover:text-zen-ink flex items-center justify-center"
        aria-label={`Remove ${name}`}
      >
        <IconX className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}

function ModeToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2 py-1 rounded-md uppercase tracking-wider font-semibold transition-colors',
        active
          ? 'bg-zen-ink text-white'
          : 'bg-zen-canvas text-zen-muted hover:bg-zen-surface',
      )}
    >
      {label}
    </button>
  );
}

function SuggestionGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3 first:mt-0">
      <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold mb-1">
        {label}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SuggestionRow({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-zen-surface text-left transition-colors"
    >
      {children}
    </button>
  );
}
