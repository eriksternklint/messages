'use client';

import { dispatch } from '@/lib/events';
import { useNodeStore } from '@/store';
import type { Channel, Message, Person } from '@/types';

/**
 * Consumes the `?joined=...` query param the invite accept page
 * redirects to. Idempotent: stores a flag in sessionStorage so a
 * refresh doesn't re-run the join ceremony. Adds the new person to
 * the directory, creates a welcome DM between them and `u:you`, and
 * drops a friendly welcome message into the channel so the Home view
 * shows something immediately.
 */
export function consumeJoinedParam(): boolean {
  if (typeof window === 'undefined') return false;
  const url = new URL(window.location.href);
  const raw = url.searchParams.get('joined');
  if (!raw) return false;

  const storageKey = `node-joined:${raw.slice(0, 32)}`;
  if (sessionStorage.getItem(storageKey)) {
    // Already consumed this token in this tab — just clean the URL.
    url.searchParams.delete('joined');
    window.history.replaceState({}, '', url.toString());
    return false;
  }

  let payload: {
    name?: string;
    email?: string;
    title?: string;
    color?: Person['color'];
    workspace?: string;
    invitedByName?: string;
  } | null = null;
  try {
    payload = JSON.parse(decodeURIComponent(raw));
  } catch {
    payload = null;
  }
  if (!payload?.name || !payload?.email) {
    url.searchParams.delete('joined');
    window.history.replaceState({}, '', url.toString());
    return false;
  }

  sessionStorage.setItem(storageKey, '1');

  const store = useNodeStore.getState();
  const now = new Date().toISOString();
  const personId = `u:${payload.email.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const person: Person = {
    id: personId,
    name: payload.name,
    email: payload.email,
    title: payload.title,
    color: payload.color ?? 'indigo',
    team: 'New joiner',
    bio: `Joined ${payload.workspace ?? 'the workspace'} via an invite from ${payload.invitedByName ?? 'a teammate'}.`,
    addedAt: now,
    startDate: now,
    online: true,
  };
  store.addPerson(person);

  // Create a welcome DM between You and the new joiner so they appear
  // in the sidebar and have somewhere to start chatting.
  const channelId = `dm:${personId}`;
  const channel: Channel = {
    id: channelId,
    kind: 'dm',
    name: payload.name,
    workspace: 'work',
    memberIds: ['u:you', personId],
    lastMessageAt: now,
  };
  store.upsertChannel(channel);

  const welcomeFromSystem: Message = {
    id: `sys:welcome-${Date.now()}`,
    source: 'system',
    channelId,
    author: { id: 'system', name: 'Node', kind: 'system' },
    createdAt: now,
    blocks: [
      {
        type: 'markdown',
        content: `🎉 **${payload.name}** just joined ${payload.workspace ?? 'Node'}. Say hi!`,
      },
    ],
    rawText: `${payload.name} joined ${payload.workspace ?? 'Node'}.`,
  };
  dispatch({ kind: 'message.created', message: welcomeFromSystem });

  const hiFromThem: Message = {
    id: `hi:${personId}-${Date.now()}`,
    source: 'node-channel',
    channelId,
    author: { id: personId, name: payload.name, kind: 'human' },
    createdAt: now,
    blocks: [
      {
        type: 'text',
        content: `Hey! Just joined — excited to be here. What should I start with?`,
      },
    ],
    rawText: `Hey! Just joined — excited to be here. What should I start with?`,
  };
  dispatch({ kind: 'message.created', message: hiFromThem });

  store.setActiveChannel(channelId);

  // Clean up the URL so reloads don't retrigger.
  url.searchParams.delete('joined');
  window.history.replaceState({}, '', url.toString());

  return true;
}
