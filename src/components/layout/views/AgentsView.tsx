'use client';

import { useMemo, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { Avatar } from '@/components/chat/Avatar';
import { BlockRenderer } from '@/components/chat/BlockRenderer';
import { IconPlus, IconRobot, IconSparkle } from '@/components/icons';
import { dispatch } from '@/lib/events';
import { MARKETPLACE, type MarketplaceListing } from '@/lib/agents/marketplace';
import { cn } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { Agent, Message } from '@/types';

/**
 * The Agent Marketplace. Left rail lists installed agents + a link to
 * browse the catalog; the main pane is either the catalog grid or the
 * detail/demo page for a selected listing. Installing an agent pushes
 * it into the `agentsSlice`, and "Start DM" seeds a private channel
 * with the agent as the only other member.
 *
 * Custom upload: the `+ Upload skill` button opens a placeholder form
 * that accepts a Claude skill handle. Real upload happens through the
 * server-side skill registry (placeholder for now).
 */
export function AgentsView() {
  const installed = useNodeStore(
    useShallow((s) => Object.values(s.agentsById)),
  );
  const registerAgent = useNodeStore((s) => s.registerAgent);
  const upsertChannel = useNodeStore((s) => s.upsertChannel);
  const setActiveChannel = useNodeStore((s) => s.setActiveChannel);
  const setView = useNodeStore((s) => s.setView);
  const openCreateModal = useNodeStore((s) => s.openCreateModal);

  const [selectedId, setSelectedId] = useState<string | null>(
    MARKETPLACE[0]?.id ?? null,
  );
  const [uploadOpen, setUploadOpen] = useState(false);

  const selected = useMemo(
    () => MARKETPLACE.find((m) => m.id === selectedId) ?? null,
    [selectedId],
  );

  const isInstalled = (listing: MarketplaceListing): boolean =>
    installed.some((a) => a.marketplace?.listingId === listing.id);

  function install(listing: MarketplaceListing) {
    if (isInstalled(listing)) return;
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
  }

  function startDM(listing: MarketplaceListing) {
    // Find or create an agent for this listing, then drop the user
    // into a fresh DM with it as the only other member.
    let agent = installed.find(
      (a) => a.marketplace?.listingId === listing.id,
    );
    if (!agent) {
      install(listing);
      agent = {
        id: `agent:${listing.id.replace('mkt:', '')}-${Date.now()}`,
        name: listing.name,
        persona: listing.tagline,
        provider: 'anthropic',
        installedAt: new Date().toISOString(),
        workspaceIds: ['ws:work'],
        channelIds: [],
      };
    }

    const channelId = `dm:${listing.id}`;
    upsertChannel({
      id: channelId,
      kind: 'dm',
      name: listing.name,
      workspace: 'work',
      memberIds: ['u:you', agent.id],
      agentIds: [agent.id],
      lastMessageAt: new Date().toISOString(),
    });

    // Seed the agent's intro message so the DM isn't empty.
    const intro: Message = {
      id: `agent-intro:${Date.now()}`,
      source: 'agent',
      channelId,
      author: {
        id: agent.id,
        name: agent.name,
        kind: 'agent',
        agentPersona: listing.tagline,
      },
      createdAt: new Date().toISOString(),
      blocks: [
        {
          type: 'markdown',
          content: `Hi — I'm **${listing.name}**. ${listing.description}\n\nAsk me to **${listing.demo.userPrompt}** to see what I'm good at.`,
        },
      ],
      rawText: `Hi — I'm ${listing.name}. ${listing.description}`,
      ai: { priority: 'fyi' },
    };
    dispatch({
      kind: 'agent.push',
      agentId: agent.id,
      channelId,
      message: intro,
    });

    setActiveChannel(channelId);
    setView('home');
  }

  function runDemo(listing: MarketplaceListing) {
    // Drop the user's fake prompt + the agent's pre-baked response
    // into the currently active channel so "Try it" has feedback.
    const channelId = useNodeStore.getState().activeChannelId;
    if (!channelId) return;
    const prompt: Message = {
      id: `local:${Date.now()}`,
      source: 'node-channel',
      channelId,
      author: { id: 'u:you', name: 'You', kind: 'human' },
      createdAt: new Date().toISOString(),
      blocks: [{ type: 'text', content: listing.demo.userPrompt }],
      rawText: listing.demo.userPrompt,
    };
    dispatch({ kind: 'message.created', message: prompt });
    const response: Message = {
      id: `agent-demo:${Date.now()}`,
      source: 'agent',
      channelId,
      author: {
        id: `agent:${listing.id}`,
        name: listing.name,
        kind: 'agent',
        agentPersona: listing.tagline,
      },
      createdAt: new Date().toISOString(),
      blocks: listing.demo.response,
      rawText: `Demo response from ${listing.name}`,
      ai: { priority: 'fyi' },
    };
    dispatch({
      kind: 'agent.push',
      agentId: `agent:${listing.id}`,
      channelId,
      message: response,
    });
    setView('home');
  }

  return (
    <>
      <aside className="w-[260px] border-r border-zen-border flex flex-col bg-zen-canvas min-h-0 flex-shrink-0">
        <div className="px-4 pt-4 pb-2">
          <div className="text-[15px] font-semibold text-zen-ink">Agents</div>
          <div className="text-[11px] text-zen-subtle mt-0.5">
            Install, DM, or upload your own.
          </div>
        </div>
        <div className="px-3 mt-2">
          <button
            onClick={() => setUploadOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-zen-ink text-white text-[12px] font-medium hover:bg-zen-accent transition-colors shadow-zen-soft"
          >
            <IconPlus className="h-3.5 w-3.5" />
            Upload skill
          </button>
        </div>
        <div className="mt-4 px-2 text-[10px] uppercase tracking-wider text-zen-subtle font-semibold px-4">
          Installed · {installed.length}
        </div>
        <ul className="px-2 mt-1 space-y-0.5 flex-1 overflow-y-auto">
          {installed.map((a) => (
            <li key={a.id}>
              <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zen-surface/60 text-[13px] text-zen-ink">
                <Avatar name={a.name} kind="agent" size="sm" />
                <span className="truncate flex-1 text-left">{a.name}</span>
                {a.proactive?.enabled && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </button>
            </li>
          ))}
          {installed.length === 0 && (
            <li className="text-[11px] text-zen-subtle italic px-2 py-2">
              No agents installed yet.
            </li>
          )}
        </ul>
        <div className="border-t border-zen-border px-4 py-3 text-[10px] text-zen-subtle flex-shrink-0">
          Powered by Claude skills.
        </div>
      </aside>

      <div className="flex-1 flex flex-col bg-zen-bg min-w-0">
        <div className="border-b border-zen-border px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="text-[15px] font-semibold text-zen-ink">
              Agent marketplace
            </div>
            <div className="text-[11px] text-zen-subtle">
              {MARKETPLACE.length} listings · community and official agents
            </div>
          </div>
          <button
            onClick={() => openCreateModal('new-agent')}
            className="h-8 px-3 rounded-md border border-zen-border bg-white text-zen-ink text-[12px] font-medium hover:bg-zen-surface transition-colors flex items-center gap-1.5"
          >
            <IconRobot className="h-3.5 w-3.5" />
            Build from scratch
          </button>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-[1fr_1.2fr] overflow-hidden">
          <div className="border-r border-zen-border overflow-y-auto">
            <ul className="p-4 space-y-2">
              {MARKETPLACE.map((listing) => (
                <li key={listing.id}>
                  <button
                    onClick={() => setSelectedId(listing.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-md border transition-colors',
                      selectedId === listing.id
                        ? 'bg-white border-zen-ink shadow-zen-soft'
                        : 'border-zen-border hover:bg-white hover:border-zen-strong',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={listing.name} kind="agent" size="lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-[14px] font-semibold text-zen-ink truncate">
                            {listing.name}
                          </div>
                          {isInstalled(listing) && (
                            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Installed
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zen-subtle">
                          {listing.publisher} · v{listing.version}
                        </div>
                        <div className="text-[12px] text-zen-muted mt-1 line-clamp-2">
                          {listing.tagline}
                        </div>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {listing.tools.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-zen-canvas border border-zen-border text-zen-muted"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="overflow-y-auto">
            {selected ? (
              <ListingDetail
                listing={selected}
                installed={isInstalled(selected)}
                onInstall={() => install(selected)}
                onStartDM={() => startDM(selected)}
                onRunDemo={() => runDemo(selected)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-zen-subtle text-sm">
                Select an agent to see details.
              </div>
            )}
          </div>
        </div>
      </div>

      {uploadOpen && (
        <UploadSkillModal onClose={() => setUploadOpen(false)} />
      )}
    </>
  );
}

function ListingDetail({
  listing,
  installed,
  onInstall,
  onStartDM,
  onRunDemo,
}: {
  listing: MarketplaceListing;
  installed: boolean;
  onInstall: () => void;
  onStartDM: () => void;
  onRunDemo: () => void;
}) {
  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-start gap-4">
        <Avatar name={listing.name} kind="agent" size="xl" />
        <div className="flex-1 min-w-0">
          <div className="text-[20px] font-semibold text-zen-ink">
            {listing.name}
          </div>
          <div className="text-[12px] text-zen-subtle">
            {listing.publisher} · v{listing.version} · {listing.category}
          </div>
          <div className="text-[13px] text-zen-muted mt-2">
            {listing.tagline}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button
          onClick={onInstall}
          disabled={installed}
          className={cn(
            'h-9 px-4 rounded-md text-[13px] font-medium transition-colors',
            installed
              ? 'bg-zen-surface text-zen-subtle cursor-not-allowed'
              : 'bg-zen-accent text-white hover:bg-[#1a6fc5] shadow-zen-soft',
          )}
        >
          {installed ? 'Installed' : 'Install'}
        </button>
        <button
          onClick={onStartDM}
          className="h-9 px-4 rounded-md border border-zen-border bg-white text-zen-ink text-[13px] font-medium hover:bg-zen-surface transition-colors"
        >
          Start DM
        </button>
        <button
          onClick={onRunDemo}
          className="h-9 px-4 rounded-md border border-zen-border bg-white text-zen-ink text-[13px] font-medium hover:bg-zen-surface transition-colors flex items-center gap-1.5"
        >
          <IconSparkle className="h-3.5 w-3.5" />
          Try in active chat
        </button>
      </div>

      <div className="mt-6">
        <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold">
          About
        </div>
        <div className="text-[13px] text-zen-ink mt-1 leading-relaxed">
          {listing.description}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold">
          Tools
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {listing.tools.map((t) => (
            <span
              key={t}
              className="text-[11px] px-2 py-0.5 rounded bg-zen-canvas border border-zen-border text-zen-muted font-mono"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold">
          Claude skill handle
        </div>
        <code className="text-[11px] text-zen-ink bg-zen-canvas px-2 py-1 rounded border border-zen-border inline-block mt-1">
          {listing.skillHandle}
        </code>
      </div>

      <div className="mt-6 pt-5 border-t border-zen-border">
        <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold mb-2">
          Demo
        </div>
        <div className="text-[12px] text-zen-subtle italic mb-3">
          “{listing.demo.userPrompt}”
        </div>
        <div className="space-y-2 border border-zen-border rounded-md p-4 bg-zen-canvas/50">
          {listing.demo.response.map((block, i) => (
            <BlockRenderer
              key={i}
              block={block}
              message={{
                id: `demo:${listing.id}-${i}`,
                source: 'system',
                channelId: 'demo',
                author: { id: 'system', name: 'Demo', kind: 'system' },
                createdAt: new Date().toISOString(),
                blocks: listing.demo.response,
                rawText: '',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function UploadSkillModal({ onClose }: { onClose: () => void }) {
  const [handle, setHandle] = useState('');
  const [name, setName] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-zen-ink/20 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-lg border border-zen-border shadow-zen-pop animate-zen-pop-in">
        <div className="px-5 py-4 border-b border-zen-border">
          <div className="text-sm font-semibold text-zen-ink">
            Upload a Claude skill
          </div>
          <div className="text-[11px] text-zen-subtle mt-0.5">
            Turn a skill into a full marketplace listing.
          </div>
        </div>
        <div className="p-5">
          <label className="block mb-3">
            <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-medium mb-1">
              Listing name
            </div>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="PR Review Bot"
              className="w-full text-[13px] border border-zen-border rounded-md px-2.5 py-1.5 bg-white outline-none focus:border-zen-ink/40 placeholder:text-zen-subtle"
            />
          </label>
          <label className="block mb-3">
            <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-medium mb-1">
              Skill handle
            </div>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="claude-skills/pr-reviewer"
              className="w-full text-[13px] border border-zen-border rounded-md px-2.5 py-1.5 bg-white outline-none focus:border-zen-ink/40 placeholder:text-zen-subtle font-mono"
            />
          </label>
          <div className="text-[11px] text-zen-muted mb-4">
            Skills are bundles of prompts, tool definitions, and example runs.
            Upload stores the bundle on Node and makes it installable for
            everyone in your workspace.
          </div>
          <button
            onClick={onClose}
            disabled={!name.trim() || !handle.trim()}
            className={cn(
              'w-full h-9 rounded-md text-[13px] font-medium transition-colors',
              name.trim() && handle.trim()
                ? 'bg-zen-accent text-white hover:bg-[#1a6fc5]'
                : 'bg-zen-surface text-zen-subtle cursor-not-allowed',
            )}
          >
            Publish listing
          </button>
        </div>
      </div>
    </div>
  );
}
