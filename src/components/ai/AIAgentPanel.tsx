'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Avatar } from '@/components/chat/Avatar';
import { IconCheck, IconSend, IconSparkle, IconX } from '@/components/icons';
import { dispatch } from '@/lib/events';
import { cn } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { Channel, Message, Person } from '@/types';

/**
 * The AI Agent panel — replaces the old floating chat bubble with a
 * full-height right-sidebar conversation. The agent has REAL workspace
 * powers: it can list unread/draft messages, jump to a channel, send a
 * message on the user's behalf, reply in a thread, summarize, etc.
 *
 * Tool routing is intentionally pattern-matched (keywords + regex) so
 * the demo works without burning a Claude API call. Every tool that
 * mutates state goes through `dispatch()` so the rest of the app sees
 * the change exactly as if the user had typed it themselves.
 */

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** Tool calls the agent ran while preparing this turn. */
  actions?: AgentAction[];
}

interface AgentAction {
  id: string;
  label: string;
  done: boolean;
}

const QUICK_PROMPTS = [
  'What have I missed today?',
  'List messages I still owe a reply to',
  'Summarize the active channel',
  'Draft a reply to the most urgent message',
];

export function AIAgentPanel() {
  const close = useNodeStore((s) => s.setAIAgentOpen);

  const activeChannelId = useNodeStore((s) => s.activeChannelId);
  const channelsById = useNodeStore((s) => s.channelsById);
  const messagesById = useNodeStore((s) => s.messagesById);
  const messageIdsByChannel = useNodeStore((s) => s.messageIdsByChannel);
  const peopleById = useNodeStore((s) => s.peopleById);
  const setActiveChannel = useNodeStore((s) => s.setActiveChannel);

  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "I'm your Node Agent. I have full read access to every channel, message, person, and agent in this workspace — and I can act on your behalf.\n\nTry asking me to list what you've missed, draft a reply, or send something on your behalf.",
    },
  ]);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 99_999 });
  }, [turns]);

  function addTurn(turn: ChatTurn) {
    setTurns((prev) => [...prev, turn]);
  }

  function send(prompt?: string) {
    const text = (prompt ?? draft).trim();
    if (!text) return;
    addTurn({
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
    });
    setDraft('');
    // Run the agent in a microtask so the UI flushes the user turn first.
    setTimeout(() => runAgent(text), 200);
  }

  function runAgent(prompt: string) {
    const result = handleAgentPrompt({
      prompt,
      messagesById,
      channelsById,
      messageIdsByChannel,
      peopleById,
      activeChannelId,
      setActiveChannel,
    });
    addTurn({
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: result.reply,
      actions: result.actions,
    });
  }

  return (
    <aside className="w-[380px] border-l border-zen-border bg-zen-bg flex flex-col min-h-0 flex-shrink-0 animate-zen-fade">
      <header className="h-11 border-b border-zen-border flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-zen-ink">
          <IconSparkle className="h-3.5 w-3.5 text-zen-accent" />
          AI Agent
          <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold">
            Live
          </span>
        </div>
        <button
          onClick={() => close(false)}
          className="h-7 w-7 rounded-md hover:bg-zen-surface flex items-center justify-center text-zen-muted"
          aria-label="Close AI Agent"
        >
          <IconX className="h-3.5 w-3.5" />
        </button>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {turns.map((turn) => (
          <Turn key={turn.id} turn={turn} />
        ))}
        {turns.length === 1 && (
          <div className="pt-2">
            <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold pb-1.5">
              Try
            </div>
            <ul className="space-y-1">
              {QUICK_PROMPTS.map((p) => (
                <li key={p}>
                  <button
                    onClick={() => send(p)}
                    className="w-full text-left text-[12px] px-2 py-1.5 rounded-md bg-white border border-zen-border hover:border-zen-ink/40 hover:bg-zen-canvas transition-colors text-zen-ink"
                  >
                    {p}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t border-zen-border p-3 flex-shrink-0">
        <div className="flex items-end gap-2 border border-zen-border rounded-md bg-white px-2 py-1.5 focus-within:border-zen-ink/40">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Ask the agent — it can act on your behalf"
            className="flex-1 resize-none bg-transparent outline-none text-[12px] text-zen-ink placeholder:text-zen-subtle leading-relaxed py-1 max-h-32"
          />
          <button
            onClick={() => send()}
            disabled={!draft.trim()}
            className={cn(
              'h-7 w-7 rounded-md flex items-center justify-center transition-colors',
              draft.trim()
                ? 'bg-zen-accent text-white hover:bg-[#1a6fc5]'
                : 'bg-zen-surface text-zen-subtle cursor-not-allowed',
            )}
            aria-label="Send"
          >
            <IconSend className="h-3 w-3" />
          </button>
        </div>
        <div className="mt-1.5 text-[10px] text-zen-subtle">
          Agent reads every channel · acts via dispatch
        </div>
      </div>
    </aside>
  );
}

function Turn({ turn }: { turn: ChatTurn }) {
  if (turn.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] px-3 py-2 rounded-lg bg-zen-ink text-white text-[12px] whitespace-pre-wrap">
          {turn.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2">
      <Avatar name="Node Agent" kind="agent" size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold mb-1">
          Node Agent
        </div>
        {turn.actions && turn.actions.length > 0 && (
          <ul className="mb-2 space-y-0.5">
            {turn.actions.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-1.5 text-[11px] text-zen-muted"
              >
                <IconCheck
                  className={cn(
                    'h-3 w-3',
                    a.done ? 'text-emerald-600' : 'text-zen-subtle',
                  )}
                />
                <span>{a.label}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="text-[12px] text-zen-ink leading-relaxed whitespace-pre-wrap">
          {turn.content}
        </div>
      </div>
    </div>
  );
}

/**
 * The agent "brain" — pattern-matches the prompt against a small set
 * of intents and either reads or mutates state.
 */
function handleAgentPrompt(args: {
  prompt: string;
  messagesById: Record<string, Message>;
  channelsById: Record<string, Channel>;
  messageIdsByChannel: Record<string, string[]>;
  peopleById: Record<string, Person>;
  activeChannelId: string | null;
  setActiveChannel: (id: string) => void;
}): { reply: string; actions: AgentAction[] } {
  const { prompt, messagesById, channelsById, peopleById, activeChannelId } = args;
  const lower = prompt.toLowerCase();

  // ────── Intent: send a message to a person ──────
  // "answer sarah in a thread that XXX"
  // "tell jamie that I'm out tomorrow"
  // "send mia 'meet at 3'"
  const sendMatch =
    /(?:answer|reply\s+to|tell|message|send|dm)\s+([a-z][a-z\s]+?)\s+(?:that|saying|with|:)\s+(.+)/i.exec(
      prompt,
    );
  if (sendMatch) {
    const targetName = sendMatch[1].trim();
    const messageBody = sendMatch[2].trim().replace(/^["']|["']$/g, '');
    const inThread = /\bin\s+a?\s*thread\b/i.test(prompt);
    return performSend({
      targetName,
      messageBody,
      inThread,
      messagesById,
      channelsById,
      peopleById,
      activeChannelId,
    });
  }

  // ────── Intent: list messages I haven't replied to ──────
  if (
    /haven't|have not|missed|owe|need.*reply|to reply|unanswered/i.test(lower) ||
    /what.*missed/i.test(lower)
  ) {
    return listOwedReplies(messagesById, channelsById);
  }

  // ────── Intent: summarize active channel ──────
  if (/summari[sz]e/i.test(lower)) {
    if (!activeChannelId) {
      return {
        reply: "Open a channel first and I'll summarize it.",
        actions: [],
      };
    }
    return summarizeChannel(activeChannelId, channelsById, messagesById);
  }

  // ────── Intent: draft a reply ──────
  if (/draft.*reply|write.*response|how should i respond/i.test(lower)) {
    return draftReply(activeChannelId, channelsById, messagesById);
  }

  // ────── Intent: who is X / show profile ──────
  if (/^who\s+is\s+(.+)/i.test(prompt)) {
    const m = /^who\s+is\s+(.+?)\??$/i.exec(prompt);
    if (m) {
      return showProfile(m[1].trim(), peopleById);
    }
  }

  // ────── Default ──────
  return {
    reply:
      "I can read every channel and act on your behalf. Try one of:\n\n" +
      '• "What have I missed today?"\n' +
      '• "Reply to Mia that I\'ll review the doc tonight"\n' +
      '• "Summarize this channel"\n' +
      '• "Draft a reply to the most urgent message"\n' +
      '• "Who is Alex Chen?"',
    actions: [],
  };
}

/** Find a person by partial-name match. */
function findPerson(
  name: string,
  peopleById: Record<string, Person>,
): Person | undefined {
  const needle = name.toLowerCase().trim();
  const entries = Object.values(peopleById).filter((p) => p.id !== 'u:you');
  // Exact first.
  const exact = entries.find((p) => p.name.toLowerCase() === needle);
  if (exact) return exact;
  // First-name match.
  const first = entries.find(
    (p) => p.name.toLowerCase().split(' ')[0] === needle.split(' ')[0],
  );
  if (first) return first;
  // Includes.
  return entries.find((p) => p.name.toLowerCase().includes(needle));
}

function performSend(args: {
  targetName: string;
  messageBody: string;
  inThread: boolean;
  messagesById: Record<string, Message>;
  channelsById: Record<string, Channel>;
  peopleById: Record<string, Person>;
  activeChannelId: string | null;
}): { reply: string; actions: AgentAction[] } {
  const person = findPerson(args.targetName, args.peopleById);
  if (!person) {
    return {
      reply: `I couldn't find anyone named "${args.targetName}". Try their full name?`,
      actions: [],
    };
  }

  // Find or create a DM with that person.
  let channel = Object.values(args.channelsById).find(
    (c) =>
      c.kind === 'dm' &&
      c.memberIds.length === 2 &&
      c.memberIds.includes('u:you') &&
      c.memberIds.includes(person.id),
  );
  if (!channel) {
    channel = {
      id: `dm:${person.id}`,
      kind: 'dm',
      name: person.name,
      workspace: 'work',
      memberIds: ['u:you', person.id],
      lastMessageAt: new Date().toISOString(),
    };
    useNodeStore.getState().upsertChannel(channel);
  }

  // If the user wants a thread, find the most-recent message from this
  // person to nest under.
  let threadId: string | undefined;
  if (args.inThread) {
    const ids = useNodeStore.getState().messageIdsByChannel[channel.id] ?? [];
    for (let i = ids.length - 1; i >= 0; i--) {
      const m = args.messagesById[ids[i]];
      if (m && m.author.id === person.id) {
        threadId = m.id;
        break;
      }
    }
  }

  const message: Message = {
    id: `agent:send-${Date.now()}`,
    source: 'node-channel',
    channelId: channel.id,
    threadId,
    author: { id: 'u:you', name: 'You', kind: 'human' },
    createdAt: new Date().toISOString(),
    blocks: [{ type: 'text', content: args.messageBody }],
    rawText: args.messageBody,
  };
  dispatch({ kind: 'message.created', message });
  useNodeStore.getState().setActiveChannel(channel.id);

  return {
    reply: `Sent.${args.inThread && threadId ? ' Replied in thread.' : ''} I opened ${person.name}'s DM so you can follow the conversation.`,
    actions: [
      { id: 'find', label: `Found ${person.name} in directory`, done: true },
      {
        id: 'dm',
        label: args.inThread ? 'Replied inside their thread' : 'Posted in DM',
        done: true,
      },
      { id: 'switch', label: 'Switched to that channel', done: true },
    ],
  };
}

function listOwedReplies(
  messagesById: Record<string, Message>,
  channelsById: Record<string, Channel>,
): { reply: string; actions: AgentAction[] } {
  // Heuristic: a message I "owe" a reply to is the latest message in
  // a channel where the author is not me, and there's no later
  // message from me. Cap at 8.
  const byChannel = new Map<string, Message>();
  for (const m of Object.values(messagesById)) {
    if (m.threadId) continue;
    const existing = byChannel.get(m.channelId);
    if (!existing || existing.createdAt < m.createdAt) {
      byChannel.set(m.channelId, m);
    }
  }
  const owed: Message[] = [];
  for (const m of byChannel.values()) {
    if (m.author.id !== 'u:you' && m.author.kind === 'human') {
      owed.push(m);
    }
  }
  owed.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const top = owed.slice(0, 8);

  if (top.length === 0) {
    return {
      reply: "You're all caught up — nothing waiting on a reply from you.",
      actions: [{ id: 'scan', label: 'Scanned every channel', done: true }],
    };
  }

  const lines = top
    .map((m) => {
      const channel = channelsById[m.channelId];
      const where = channel
        ? channel.kind === 'dm'
          ? `DM: ${channel.name}`
          : `#${channel.name}`
        : 'unknown';
      const preview = m.rawText.replace(/\s+/g, ' ').slice(0, 90);
      return `• **${m.author.name}** — ${where}\n  "${preview}${preview.length === 90 ? '…' : ''}"`;
    })
    .join('\n\n');

  return {
    reply: `You have **${top.length}** message${top.length === 1 ? '' : 's'} waiting on a reply:\n\n${lines}\n\nWant me to draft a response to any of them?`,
    actions: [
      {
        id: 'scan',
        label: `Scanned ${Object.keys(channelsById).length} channels`,
        done: true,
      },
      { id: 'rank', label: `Found ${top.length} owed replies`, done: true },
    ],
  };
}

function summarizeChannel(
  channelId: string,
  channelsById: Record<string, Channel>,
  messagesById: Record<string, Message>,
): { reply: string; actions: AgentAction[] } {
  const channel = channelsById[channelId];
  if (!channel) {
    return { reply: "I can't find that channel.", actions: [] };
  }
  const ids = useNodeStore.getState().messageIdsByChannel[channelId] ?? [];
  const recent = ids
    .slice(-15)
    .map((id) => messagesById[id])
    .filter(Boolean) as Message[];
  if (recent.length === 0) {
    return { reply: 'Nothing to summarize — channel is empty.', actions: [] };
  }
  const speakers = Array.from(
    new Set(recent.map((m) => m.author.name)),
  ).slice(0, 4);
  const headline = `**#${channel.name}** · last ${recent.length} messages from ${speakers.join(', ')}`;
  const bullets = recent
    .slice(-5)
    .map((m) => `• ${m.author.name}: ${m.rawText.replace(/\s+/g, ' ').slice(0, 110)}`)
    .join('\n');
  return {
    reply: `${headline}\n\n${bullets}`,
    actions: [
      { id: 'read', label: `Read ${recent.length} messages`, done: true },
      { id: 'sum', label: 'Compressed into 5 bullets', done: true },
    ],
  };
}

function draftReply(
  channelId: string | null,
  channelsById: Record<string, Channel>,
  messagesById: Record<string, Message>,
): { reply: string; actions: AgentAction[] } {
  if (!channelId) {
    return { reply: 'Open a channel first.', actions: [] };
  }
  const ids = useNodeStore.getState().messageIdsByChannel[channelId] ?? [];
  const target = [...ids]
    .reverse()
    .map((id) => messagesById[id])
    .find((m) => m && m.author.id !== 'u:you' && m.author.kind === 'human');
  if (!target) {
    return {
      reply: 'I see no incoming messages to reply to in this channel.',
      actions: [],
    };
  }
  const draft = `Thanks ${target.author.name.split(' ')[0]} — looking at this now and will get back to you within the hour.`;
  return {
    reply: `Here's a draft reply to **${target.author.name}**'s last message:\n\n> ${draft}\n\nSay "send it" or rewrite it inline and I'll post.`,
    actions: [
      { id: 'find', label: 'Found most recent inbound message', done: true },
      { id: 'gen', label: 'Generated a one-line draft', done: true },
    ],
  };
}

function showProfile(
  name: string,
  peopleById: Record<string, Person>,
): { reply: string; actions: AgentAction[] } {
  const person = findPerson(name, peopleById);
  if (!person) {
    return {
      reply: `I couldn't find anyone matching "${name}".`,
      actions: [],
    };
  }
  return {
    reply: `**${person.name}** (${person.pronouns ?? '—'})\n${person.title} · ${person.team}\n${person.location ?? ''}\n\n${person.bio ?? ''}`,
    actions: [
      { id: 'lookup', label: `Looked up ${person.name} in directory`, done: true },
    ],
  };
}
