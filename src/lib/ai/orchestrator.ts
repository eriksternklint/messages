import { subscribe } from '@/lib/events';
import { useNodeStore } from '@/store';
import type { InboundEvent, Message } from '@/types';

import { generateDraft } from './draft-client';
import { classifyIntent } from './intent';

/**
 * The AI Orchestration Layer.
 *
 * Installs a single listener on the event bus. Every newly-ingested
 * inbound message (Notion comment, WhatsApp inbound, native channel
 * post, agent push) flows through here:
 *
 *   1. Synchronous intent classification → priority bucket assignment
 *      (Ghost Tracking extracts commitments and deferUntil dates).
 *   2. For `action` priority messages, kick off an async draft request
 *      to /api/ai/draft and write the result back to the store.
 *
 * Because the composer reads `message.ai.draftedResponse` directly,
 * the draft "appears" in the input a moment after the message lands
 * — the Pre-Filled Response Engine feedback loop.
 *
 * The function is idempotent: safe to call multiple times (React
 * StrictMode double-invoke, hot reload, etc).
 */
let installed = false;

export function installOrchestrator(): void {
  if (installed) return;
  installed = true;

  subscribe(handleEvent);
}

async function handleEvent(event: InboundEvent): Promise<void> {
  const msg = extractMessage(event);
  if (!msg) return;

  // Never classify or draft our own outgoing messages.
  if (msg.author.id === 'u:you' || msg.author.kind === 'system') return;

  // Agent pushes land as FYI — they're not things to "reply to".
  if (event.kind === 'agent.push') {
    useNodeStore.getState().assignToBucket(msg.id, 'fyi');
    useNodeStore.getState().updateMessage({
      ...msg,
      ai: { ...msg.ai, priority: 'fyi' },
    });
    return;
  }

  // Classify intent synchronously.
  const intent = classifyIntent(msg);
  const store = useNodeStore.getState();
  store.assignToBucket(msg.id, intent.priority);
  store.updateMessage({
    ...msg,
    ai: {
      ...msg.ai,
      priority: intent.priority,
      intentTags: intent.intentTags,
      deferUntil: intent.deferUntil,
    },
  });

  // Only `action` messages get drafted — everything else doesn't need
  // a pre-filled response.
  if (intent.priority !== 'action') return;

  try {
    const result = await generateDraft(msg);
    const latest = useNodeStore.getState().messagesById[msg.id];
    if (!latest) return;
    useNodeStore.getState().updateMessage({
      ...latest,
      ai: {
        ...latest.ai,
        priority: intent.priority,
        intentTags: intent.intentTags,
        deferUntil: intent.deferUntil,
        draftedResponse: result.draftedResponse,
        contextSources: result.contextSources,
        confidence: result.confidence,
      },
    });
  } catch (err) {
    console.error('[orchestrator] draft generation failed', err);
  }
}

function extractMessage(event: InboundEvent): Message | null {
  switch (event.kind) {
    case 'message.created':
    case 'message.updated':
    case 'whatsapp.inbound':
    case 'agent.push':
      return event.message;
    case 'notion.comment.created':
      return event.comment;
    default:
      return null;
  }
}
