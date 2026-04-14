'use client';

import { useMemo, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { Avatar } from '@/components/chat/Avatar';
import {
  IconBriefcase,
  IconSearch,
  IconUsers,
  IconX,
} from '@/components/icons';
import { ORG_TEAMS } from '@/lib/seed-people';
import { cn } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { Person } from '@/types';

/**
 * The Org Directory — a floating, full-height panel that lists every
 * person in the workspace. Three columns:
 *
 *  1. Team filter rail — All + every team name + member count
 *  2. People list — search-filtered, click to select
 *  3. Profile card — work info, manager chain, interests
 *
 * Triggered from the top-bar people button. Closes on Escape or the X.
 */
export function OrgDirectory() {
  const open = useNodeStore((s) => s.orgDirectoryOpen);
  const setOpen = useNodeStore((s) => s.setOrgDirectoryOpen);
  const peopleById = useNodeStore(
    useShallow((s) => s.peopleById),
  );
  const setStartChatOpen = useNodeStore((s) => s.setStartChatOpen);

  const [team, setTeam] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const people = useMemo(
    () =>
      Object.values(peopleById).filter(
        (p) => p.id !== 'u:you' && p.id.startsWith('u:'),
      ),
    [peopleById],
  );

  const teamCounts = useMemo(() => {
    const counts: Record<string, number> = { All: people.length };
    for (const p of people) {
      if (p.team) counts[p.team] = (counts[p.team] ?? 0) + 1;
    }
    return counts;
  }, [people]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people
      .filter((p) => team === 'All' || p.team === team)
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          (p.title?.toLowerCase().includes(q) ?? false) ||
          (p.team?.toLowerCase().includes(q) ?? false) ||
          (p.email?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [people, team, query]);

  const selected = selectedId ? peopleById[selectedId] : filtered[0];
  const manager = selected?.managerId
    ? peopleById[selected.managerId]
    : undefined;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zen-ink/40 animate-zen-fade"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-[940px] max-w-[95vw] h-[640px] max-h-[90vh] bg-white rounded-xl shadow-zen-pop border border-zen-border flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="h-12 px-4 border-b border-zen-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <IconUsers className="h-4 w-4 text-zen-ink" />
            <div className="text-[14px] font-semibold text-zen-ink">
              People
            </div>
            <span className="text-[11px] text-zen-subtle">
              {people.length} in your workspace
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="h-7 w-7 rounded-md hover:bg-zen-surface flex items-center justify-center text-zen-muted"
            aria-label="Close directory"
          >
            <IconX className="h-3.5 w-3.5" />
          </button>
        </header>

        <div className="flex-1 flex min-h-0">
          {/* Team rail */}
          <nav className="w-[180px] border-r border-zen-border bg-zen-canvas flex flex-col flex-shrink-0">
            <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-zen-subtle font-semibold">
              Teams
            </div>
            <ul className="px-2 space-y-0.5 overflow-y-auto">
              {['All', ...ORG_TEAMS].map((t) => (
                <li key={t}>
                  <button
                    onClick={() => setTeam(t)}
                    className={cn(
                      'w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[12px] transition-colors',
                      team === t
                        ? 'bg-zen-ink text-white'
                        : 'text-zen-muted hover:bg-zen-surface hover:text-zen-ink',
                    )}
                  >
                    <span className="truncate">{t}</span>
                    <span
                      className={cn(
                        'text-[10px] tabular-nums',
                        team === t ? 'text-white/70' : 'text-zen-subtle',
                      )}
                    >
                      {teamCounts[t] ?? 0}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* People list */}
          <section className="w-[300px] border-r border-zen-border flex flex-col min-h-0 flex-shrink-0">
            <div className="p-3 border-b border-zen-border flex-shrink-0">
              <div className="flex items-center gap-2 h-8 px-2.5 rounded-md border border-zen-border bg-white focus-within:border-zen-ink/40">
                <IconSearch className="h-3.5 w-3.5 text-zen-subtle" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, title, team…"
                  className="flex-1 bg-transparent text-[12px] text-zen-ink placeholder:text-zen-subtle outline-none"
                />
              </div>
            </div>
            <ul className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
              {filtered.map((p) => (
                <PersonRow
                  key={p.id}
                  person={p}
                  selected={selected?.id === p.id}
                  onClick={() => setSelectedId(p.id)}
                />
              ))}
              {filtered.length === 0 && (
                <li className="text-center text-[12px] text-zen-subtle py-8">
                  No matches. Try a different search.
                </li>
              )}
            </ul>
          </section>

          {/* Profile card */}
          <article className="flex-1 min-w-0 overflow-y-auto">
            {selected ? (
              <ProfileCard
                person={selected}
                manager={manager}
                onMessage={() => {
                  setOpen(false);
                  setStartChatOpen(true);
                  // The StartChat modal reads the seedSelection from
                  // store on open; for now we just close + open it.
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-zen-subtle text-[12px]">
                Select someone to see their profile
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}

function PersonRow({
  person,
  selected,
  onClick,
}: {
  person: Person;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors',
          selected
            ? 'bg-zen-accentSoft text-zen-ink'
            : 'hover:bg-zen-surface text-zen-muted',
        )}
      >
        <Avatar
          name={person.name}
          avatarUrl={person.avatarUrl}
          size="sm"
          online={person.online}
        />
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-medium text-zen-ink truncate">
            {person.name}
          </div>
          <div className="text-[10px] text-zen-subtle truncate">
            {person.title}
          </div>
        </div>
      </button>
    </li>
  );
}

function ProfileCard({
  person,
  manager,
  onMessage,
}: {
  person: Person;
  manager?: Person;
  onMessage: () => void;
}) {
  return (
    <div className="p-6">
      <div className="flex items-start gap-4">
        <Avatar
          name={person.name}
          avatarUrl={person.avatarUrl}
          size="xl"
          online={person.online}
        />
        <div className="flex-1 min-w-0">
          <div className="text-[18px] font-semibold text-zen-ink">
            {person.name}
            {person.pronouns && (
              <span className="ml-2 text-[11px] text-zen-subtle font-normal">
                ({person.pronouns})
              </span>
            )}
          </div>
          <div className="text-[12px] text-zen-muted">{person.title}</div>
          <div className="text-[11px] text-zen-subtle mt-0.5">
            {person.team} · {person.location}
          </div>
          <button
            onClick={onMessage}
            className="mt-3 px-3 h-7 rounded-md bg-zen-ink text-white text-[11px] font-medium hover:bg-zen-accent transition-colors"
          >
            Send message
          </button>
        </div>
      </div>

      {person.bio && (
        <Section label="About">
          <p className="text-[12px] text-zen-ink leading-relaxed">
            {person.bio}
          </p>
        </Section>
      )}

      <Section label="Work">
        <dl className="space-y-1.5 text-[12px]">
          <Row label="Title" value={person.title} />
          <Row label="Team" value={person.team} />
          <Row label="Level" value={person.level} />
          <Row label="Email" value={person.email} mono />
          {person.username && (
            <Row label="Username" value={`@${person.username}`} mono />
          )}
          <Row label="Location" value={person.location} />
          {person.startDate && (
            <Row
              label="Started"
              value={new Date(person.startDate).toLocaleDateString(undefined, {
                month: 'short',
                year: 'numeric',
              })}
            />
          )}
        </dl>
      </Section>

      {manager && (
        <Section label="Reports to">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-zen-canvas border border-zen-border">
            <Avatar
              name={manager.name}
              avatarUrl={manager.avatarUrl}
              size="sm"
            />
            <div className="min-w-0">
              <div className="text-[12px] text-zen-ink truncate">
                {manager.name}
              </div>
              <div className="text-[10px] text-zen-subtle truncate">
                {manager.title}
              </div>
            </div>
          </div>
        </Section>
      )}

      {person.interests && person.interests.length > 0 && (
        <Section label="Interests">
          <div className="flex flex-wrap gap-1">
            {person.interests.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-zen-canvas border border-zen-border text-zen-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold pb-1.5 flex items-center gap-1">
        <IconBriefcase className="h-3 w-3" />
        {label}
      </div>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <dt className="w-20 text-zen-subtle flex-shrink-0">{label}</dt>
      <dd
        className={cn(
          'flex-1 min-w-0 text-zen-ink truncate',
          mono && 'font-mono text-[11px]',
        )}
      >
        {value}
      </dd>
    </div>
  );
}
