'use client';
import { useState } from 'react';
import type { NewsStory } from '@/types/news';
import { ShareSheet } from './ShareSheet';

export function ArticleShareButton({ story }: { story: NewsStory }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3.5 rounded-xl bg-amber-500 text-black font-semibold text-sm flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors active:scale-[0.98]"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share this story
      </button>
      {open && <ShareSheet story={story} onClose={() => setOpen(false)} />}
    </>
  );
}
