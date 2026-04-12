import type { StateCreator } from 'zustand';

import type { PriorityBucket } from '@/types';

/**
 * The Priority Feed replaces the traditional channel list: the AI
 * sorts every incoming message into one of four buckets, and the UI
 * reads this slice to render the "Attention Needed" feed.
 */
export interface PriorityFeedSlice {
  feed: Record<PriorityBucket, string[]>;

  assignToBucket: (messageId: string, bucket: PriorityBucket) => void;
  clearBucket: (bucket: PriorityBucket) => void;
}

export const priorityFeedSlice: StateCreator<
  PriorityFeedSlice,
  [],
  [],
  PriorityFeedSlice
> = (set) => ({
  feed: { action: [], fyi: [], noise: [], waiting: [] },

  assignToBucket: (messageId, bucket) =>
    set((state) => {
      // Remove from whichever bucket it currently occupies first.
      const without: Record<PriorityBucket, string[]> = {
        action: state.feed.action.filter((id) => id !== messageId),
        fyi: state.feed.fyi.filter((id) => id !== messageId),
        noise: state.feed.noise.filter((id) => id !== messageId),
        waiting: state.feed.waiting.filter((id) => id !== messageId),
      };
      return {
        feed: { ...without, [bucket]: [...without[bucket], messageId] },
      };
    }),

  clearBucket: (bucket) =>
    set((state) => ({ feed: { ...state.feed, [bucket]: [] } })),
});
