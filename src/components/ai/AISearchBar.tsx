'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  IconHash,
  IconSearch,
  IconSparkle,
  IconWhatsApp,
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { Channel, Message } from '@/types';

interface Hit {
  id: string;
  kind: 'message' | 'channel' | 'ai';
  label: string;
  sub?: string;
  onSelect: () => void;
}

/**
 * Cmd+K / Ctrl+K palette. Searches messages and channels, and always
 * offers an "Ask the AI about this" fallback hit at the top.
 */
export function AISearchBar() {
  const open = useNodeStore((s) => s.searchOpen);
  const setOpen = useNodeStore((s) => s.setSearchOpen);
  const setActiveChannel = useNodeStore((s) => s.setActiveChannel);
  const setAIPanelOpen = useNodeStore((s) => s.setAIPanelOpen);
  const messagesById = useNodeStore((s) => s.messagesById);
  const channelsById = useNodeStore((s) => s.channelsById);

  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);

  // Global Cmd+K / Ctrl+K.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!open);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) setQuery('');
    setCursor(0);
  }, [open]);

  const hits: Hit[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const results: Hit[] = [];

    if (q.length > 0) {
      results.push({
        id: 'ai:ask',
        kind: 'ai',
        label: `Ask the AI: "${query}"`,
        sub: 'Opens the Node Assistant with this question',
        onSelect: () => {
          setOpen(false);
          setAIPanelOpen(true);
        },
      });
    }

    const channels: Channel[] = Object.values(channelsById);
    for (const ch of channels) {
      if (q.length === 0 || ch.name.toLowerCase().includes(q)) {
        results.push({
          id: `ch:${ch.id}`,
          kind: 'channel',
          label: ch.name,
          sub: ch.description ?? ch.kind,
          onSelect: () => {
            setActiveChannel(ch.id);
            setOpen(false);
          },
        });
      }
      if (results.length > 14) break;
    }

    if (q.length >= 2) {
      const messages: Message[] = Object.values(messagesById);
      for (const m of messages) {
        if (m.rawText.toLowerCase().includes(q)) {
          results.push({
            id: `m:${m.id}`,
            kind: 'message',
            label: m.rawText.slice(0, 80),
            sub: `${m.author.name} in ${channelsById[m.channelId]?.name ?? 'channel'}`,
            onSelect: () => {
              setActiveChannel(m.channelId);
              setOpen(false);
            },
          });
        }
        if (results.length > 24) break;
      }
    }

    return results;
  }, [query, channelsById, messagesById, setActiveChannel, setAIPanelOpen, setOpen]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      hits[cursor]?.onSelect();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
      <div
        className="absolute inset-0 bg-zen-ink/10 backdrop-blur-[1px]"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-xl bg-white rounded-lg border border-zen-border shadow-zen-pop overflow-hidden animate-zen-pop-in">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zen-border">
          <IconSearch className="h-4 w-4 text-zen-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search messages, channels, or ask the AI…"
            className="flex-1 text-[14px] outline-none bg-transparent placeholder:text-zen-subtle text-zen-ink"
          />
          <kbd className="text-[10px] text-zen-subtle bg-zen-surface border border-zen-border rounded px-1.5 py-0.5">
            esc
          </kbd>
        </div>
        <div className="max-h-[400px] overflow-y-auto py-2">
          {hits.length === 0 && (
            <div className="px-4 py-6 text-[12px] text-zen-subtle text-center italic">
              No results. Type to search or press enter to ask the AI.
            </div>
          )}
          {hits.map((hit, i) => (
            <button
              key={hit.id}
              onMouseEnter={() => setCursor(i)}
              onClick={() => hit.onSelect()}
              className={cn(
                'w-full px-4 py-2 flex items-center gap-3 text-left transition-colors',
                i === cursor ? 'bg-zen-surface' : 'hover:bg-zen-surface/60',
              )}
            >
              <HitIcon kind={hit.kind} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-zen-ink truncate">
                  {hit.label}
                </div>
                {hit.sub && (
                  <div className="text-[11px] text-zen-subtle truncate">
                    {hit.sub}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function HitIcon({ kind }: { kind: Hit['kind'] }) {
  if (kind === 'ai') return <IconSparkle className="h-3.5 w-3.5 text-zen-accent" />;
  if (kind === 'channel') return <IconHash className="h-3.5 w-3.5 text-zen-muted" />;
  return <IconWhatsApp className="h-3.5 w-3.5 text-zen-muted" />;
}

