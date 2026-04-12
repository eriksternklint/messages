import { useNodeStore } from '@/store/useNodeStore';
import type { InboundEvent } from '@/types';

type Listener = (event: InboundEvent) => void;

const listeners = new Set<Listener>();

/**
 * Subscribe a side-effect listener to the event bus. Use this for the
 * AI Orchestration Layer (priority classification, ghost tracking,
 * pre-filled response drafting) which needs to react to events after
 * they hit the store.
 */
export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * The single entry point for pushing events into the app. Whether an
 * event originated from a Notion webhook, a WebSocket frame, an agent
 * webhook, or a local command — it must go through this function.
 *
 *  1. Mutate the store (`applyEvent`).
 *  2. Notify async listeners (AI layer, realtime broadcasters, etc.).
 */
export function dispatch(event: InboundEvent): void {
  useNodeStore.getState().applyEvent(event);
  listeners.forEach((fn) => {
    try {
      fn(event);
    } catch (err) {
      // Listeners are side-effects; failures must not break the bus.
      console.error('[events] listener error', err);
    }
  });
}
