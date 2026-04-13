'use client';

import { useEffect, useState } from 'react';

import {
  IconBriefcase,
  IconHash,
  IconRobot,
  IconUser,
  IconUsers,
  IconX,
} from '@/components/icons';
import { cn, initials } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type {
  Agent,
  Channel,
  Person,
  WorkspaceMode,
} from '@/types';

/**
 * Single dialog slot that swaps its body based on `createModal` in the
 * UI slice. Matches the "unified create" pattern from Notion — one
 * shortcut, one modal, multiple templates.
 */
export function CreateModal() {
  const kind = useNodeStore((s) => s.createModal);
  const close = useNodeStore((s) => s.closeCreateModal);

  useEffect(() => {
    if (!kind) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [kind, close]);

  if (!kind) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-zen-ink/10 backdrop-blur-[1px]"
        onClick={close}
      />
      <div className="relative w-full max-w-md bg-white rounded-lg border border-zen-border shadow-zen-pop animate-zen-pop-in">
        <div className="flex items-center justify-between px-5 py-3 border-b border-zen-border">
          <div className="text-sm font-semibold text-zen-ink">
            {TITLES[kind]}
          </div>
          <button
            onClick={close}
            className="h-7 w-7 rounded-md hover:bg-zen-surface flex items-center justify-center text-zen-muted"
            aria-label="Close"
          >
            <IconX className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="p-5">
          {kind === 'new-person' && <PersonForm onDone={close} />}
          {kind === 'new-agent' && <AgentForm onDone={close} />}
          {kind === 'new-channel' && <ChannelForm onDone={close} />}
          {kind === 'new-chat' && <ChatForm onDone={close} />}
        </div>
      </div>
    </div>
  );
}

const TITLES: Record<'new-person' | 'new-agent' | 'new-channel' | 'new-chat', string> = {
  'new-person': 'Add a person',
  'new-agent': 'Add an AI agent',
  'new-channel': 'Create a channel',
  'new-chat': 'Start a new chat',
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-3">
      <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-medium mb-1">
        {label}
      </div>
      {children}
    </label>
  );
}

const inputClass =
  'w-full text-[13px] border border-zen-border rounded-md px-2.5 py-1.5 bg-white outline-none focus:border-zen-ink/40 placeholder:text-zen-subtle';

function PrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-full h-9 rounded-md text-[13px] font-medium transition-colors',
        disabled
          ? 'bg-zen-surface text-zen-subtle cursor-not-allowed'
          : 'bg-zen-ink text-white hover:bg-zen-accent',
      )}
    >
      {children}
    </button>
  );
}

function PersonForm({ onDone }: { onDone: () => void }) {
  const addPerson = useNodeStore((s) => s.addPerson);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');

  function submit() {
    if (!name.trim()) return;
    const person: Person = {
      id: `u:${username || name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      username: username.trim() || undefined,
      addedAt: new Date().toISOString(),
    };
    addPerson(person);
    onDone();
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 p-3 bg-zen-canvas rounded-md border border-zen-border">
        <div className="h-9 w-9 rounded-full bg-white border border-zen-border flex items-center justify-center text-[11px] text-zen-muted">
          {initials(name || 'NA')}
        </div>
        <div className="text-[11px] text-zen-muted">
          A new person will appear in member lists and in Create Chat.
        </div>
      </div>
      <Field label="Full name">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Sasha Williams"
          className={inputClass}
        />
      </Field>
      <Field label="Email">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="sasha@company.com"
          className={inputClass}
        />
      </Field>
      <Field label="Phone (WhatsApp)">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 555 0100"
          className={inputClass}
        />
      </Field>
      <Field label="Username">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="sasha"
          className={inputClass}
        />
      </Field>
      <PrimaryButton disabled={!name.trim()} onClick={submit}>
        Add person
      </PrimaryButton>
    </div>
  );
}

function AgentForm({ onDone }: { onDone: () => void }) {
  const registerAgent = useNodeStore((s) => s.registerAgent);
  const [name, setName] = useState('');
  const [persona, setPersona] = useState('');
  const [prompt, setPrompt] = useState('');
  const [proactive, setProactive] = useState(false);

  function submit() {
    if (!name.trim() || !persona.trim()) return;
    const agent: Agent = {
      id: `agent:${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: name.trim(),
      persona: persona.trim(),
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      systemPrompt: prompt.trim() || undefined,
      tools: [],
      workspaceIds: ['ws:work'],
      channelIds: [],
      proactive: proactive
        ? { enabled: true, frequency: 'daily' }
        : undefined,
      installedAt: new Date().toISOString(),
    };
    registerAgent(agent);
    onDone();
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 p-3 bg-zen-canvas rounded-md border border-zen-border">
        <div className="h-9 w-9 rounded-md bg-white border border-zen-border flex items-center justify-center text-zen-muted">
          <IconRobot className="h-4 w-4" />
        </div>
        <div className="text-[11px] text-zen-muted">
          Agents run in the background and post updates into your channels.
        </div>
      </div>
      <Field label="Name">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Design Reviewer"
          className={inputClass}
        />
      </Field>
      <Field label="Persona / Role">
        <input
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          placeholder="Senior Product Designer"
          className={inputClass}
        />
      </Field>
      <Field label="System prompt (optional)">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="You review Figma files and write concise critiques…"
          className={cn(inputClass, 'resize-none')}
        />
      </Field>
      <label className="flex items-center gap-2 text-[12px] text-zen-muted mb-4">
        <input
          type="checkbox"
          checked={proactive}
          onChange={(e) => setProactive(e.target.checked)}
          className="accent-zen-ink"
        />
        Post a daily washup proactively
      </label>
      <PrimaryButton
        disabled={!name.trim() || !persona.trim()}
        onClick={submit}
      >
        Install agent
      </PrimaryButton>
    </div>
  );
}

function ChannelForm({ onDone }: { onDone: () => void }) {
  const upsertChannel = useNodeStore((s) => s.upsertChannel);
  const setActiveChannel = useNodeStore((s) => s.setActiveChannel);
  const mode = useNodeStore((s) => s.mode);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workspace, setWorkspace] = useState<WorkspaceMode>(
    mode === 'combined' ? 'work' : mode,
  );

  function submit() {
    if (!name.trim()) return;
    const channel: Channel = {
      id: `ch:${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      kind: 'channel',
      name: name.trim().replace(/\s+/g, '-').toLowerCase(),
      workspace,
      description: description.trim() || undefined,
      memberIds: ['u:you'],
      lastMessageAt: new Date().toISOString(),
    };
    upsertChannel(channel);
    setActiveChannel(channel.id);
    onDone();
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 p-3 bg-zen-canvas rounded-md border border-zen-border">
        <div className="h-9 w-9 rounded-md bg-white border border-zen-border flex items-center justify-center text-zen-muted">
          <IconHash className="h-4 w-4" />
        </div>
        <div className="text-[11px] text-zen-muted">
          Channels are spaces for focused conversations. Add members later.
        </div>
      </div>
      <Field label="Name">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="launch-plan"
          className={inputClass}
        />
      </Field>
      <Field label="Description (optional)">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Coordinating the v2 launch."
          className={inputClass}
        />
      </Field>
      <Field label="Workspace">
        <div className="flex gap-1">
          {(['work', 'personal'] as WorkspaceMode[]).map((w) => (
            <button
              key={w}
              onClick={() => setWorkspace(w)}
              className={cn(
                'flex-1 h-8 rounded-md border text-[12px] flex items-center justify-center gap-1.5 transition-colors capitalize',
                workspace === w
                  ? 'border-zen-ink bg-zen-surface text-zen-ink'
                  : 'border-zen-border text-zen-muted hover:text-zen-ink',
              )}
            >
              {w === 'work' ? (
                <IconBriefcase className="h-3 w-3" />
              ) : (
                <IconUser className="h-3 w-3" />
              )}
              {w}
            </button>
          ))}
        </div>
      </Field>
      <PrimaryButton disabled={!name.trim()} onClick={submit}>
        Create channel
      </PrimaryButton>
    </div>
  );
}

function ChatForm({ onDone }: { onDone: () => void }) {
  const upsertChannel = useNodeStore((s) => s.upsertChannel);
  const setActiveChannel = useNodeStore((s) => s.setActiveChannel);
  const peopleById = useNodeStore((s) => s.peopleById);
  const [selected, setSelected] = useState<string[]>([]);

  const people = Object.values(peopleById);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function submit() {
    if (selected.length === 0) return;
    const names = selected
      .map((id) => peopleById[id]?.name ?? id)
      .join(', ');
    const channel: Channel = {
      id: `dm:${Date.now()}`,
      kind: selected.length === 1 ? 'dm' : 'channel',
      name: names,
      workspace: 'work',
      memberIds: ['u:you', ...selected],
      lastMessageAt: new Date().toISOString(),
    };
    upsertChannel(channel);
    setActiveChannel(channel.id);
    onDone();
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 p-3 bg-zen-canvas rounded-md border border-zen-border">
        <div className="h-9 w-9 rounded-md bg-white border border-zen-border flex items-center justify-center text-zen-muted">
          <IconUsers className="h-4 w-4" />
        </div>
        <div className="text-[11px] text-zen-muted">
          Pick one or more people to start a conversation.
        </div>
      </div>

      {people.length === 0 ? (
        <div className="text-[12px] text-zen-subtle italic py-4 text-center">
          No people yet. Add one first.
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto border border-zen-border rounded-md mb-4">
          {people.map((person) => (
            <button
              key={person.id}
              onClick={() => toggle(person.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-left border-b last:border-b-0 border-zen-border transition-colors',
                selected.includes(person.id)
                  ? 'bg-zen-accentSoft'
                  : 'hover:bg-zen-surface/60',
              )}
            >
              <div className="h-6 w-6 rounded-full bg-zen-surface border border-zen-border flex items-center justify-center text-[10px] text-zen-muted flex-shrink-0">
                {initials(person.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-zen-ink truncate">
                  {person.name}
                </div>
                {person.title && (
                  <div className="text-[10px] text-zen-subtle truncate">
                    {person.title}
                  </div>
                )}
              </div>
              {selected.includes(person.id) && (
                <div className="h-1.5 w-1.5 rounded-full bg-zen-accent" />
              )}
            </button>
          ))}
        </div>
      )}

      <PrimaryButton disabled={selected.length === 0} onClick={submit}>
        Start chat
        {selected.length > 0 && ` (${selected.length})`}
      </PrimaryButton>
    </div>
  );
}
