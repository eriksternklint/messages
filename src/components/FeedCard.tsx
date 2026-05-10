'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { NewsStory } from '@/types/news';
import { CATEGORY_EMOJI, LEAN_COLOR } from '@/types/news';
import { SourceBadge } from './SourceBadge';
import { ShareSheet } from './ShareSheet';

interface Props {
  story: NewsStory;
  isActive: boolean;
  onInteract: (type: 'view' | 'read' | 'like' | 'share', watchTime: number) => void;
  isLiked: boolean;
}

export function FeedCard({ story, isActive, onInteract, isLiked }: Props) {
  const [sharing, setSharing] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const viewStartRef = useRef<number | null>(null);
  const reportedRef = useRef(false);

  useEffect(() => {
    setLiked(isLiked);
  }, [isLiked]);

  useEffect(() => {
    if (isActive && viewStartRef.current === null) {
      viewStartRef.current = Date.now();
      reportedRef.current = false;
    }
    if (!isActive && viewStartRef.current !== null) {
      const watchTime = Math.round((Date.now() - viewStartRef.current) / 1000);
      if (!reportedRef.current) {
        onInteract('view', watchTime);
        reportedRef.current = true;
      }
      viewStartRef.current = null;
    }
  }, [isActive, onInteract]);

  const handleLike = useCallback(() => {
    const next = !liked;
    setLiked(next);
    if (next) {
      const watchTime = viewStartRef.current
        ? Math.round((Date.now() - viewStartRef.current) / 1000)
        : 0;
      onInteract('like', watchTime);
    }
  }, [liked, onInteract]);

  const handleShare = useCallback(() => {
    setSharing(true);
    const watchTime = viewStartRef.current
      ? Math.round((Date.now() - viewStartRef.current) / 1000)
      : 0;
    onInteract('share', watchTime);
  }, [onInteract]);

  const uniqueSources = Array.from(
    new Map(story.sources.map((s) => [s.sourceId, s])).values()
  ).slice(0, 3);

  const primaryLean = uniqueSources[0]?.sourceLean ?? 'center';
  const accentColor = LEAN_COLOR[primaryLean];
  const categoryEmoji = CATEGORY_EMOJI[story.category];

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-950 select-none">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${story.imageUrl}')` }}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />

      {/* Top: app name + category */}
      <div className="absolute top-0 left-0 right-0 px-5 pt-6 flex items-center justify-between">
        <span className="text-white/80 font-bold text-lg tracking-tight">PRISM</span>
        <span className="text-white/70 text-sm font-medium flex items-center gap-1.5">
          {categoryEmoji}
          <span className="capitalize">{story.category}</span>
        </span>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-8">
        {/* Source badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {uniqueSources.map((s) => (
            <SourceBadge key={s.sourceId} name={s.sourceName} lean={s.sourceLean} size="sm" showLean={false} />
          ))}
          {story.sources.length > 3 && (
            <span className="text-xs text-white/50 self-center">+{story.sources.length - 3} more</span>
          )}
        </div>

        {/* Bias contrast badge */}
        {story.hasBiasContrast && (
          <div className="inline-flex items-center gap-1 mb-2 px-2 py-0.5 rounded-full bg-white/10 border border-white/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-xs text-white/70">Left & right coverage</span>
          </div>
        )}

        {/* Headline */}
        <Link href={`/article/${story.id}`} onClick={() => onInteract('read', viewStartRef.current ? Math.round((Date.now() - viewStartRef.current) / 1000) : 0)}>
          <h2
            className="text-white text-2xl font-bold leading-tight mb-2 hover:text-amber-300 transition-colors"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
          >
            {story.headline}
          </h2>
        </Link>

        {/* Summary excerpt */}
        <p className="text-white/70 text-sm leading-relaxed mb-4 line-clamp-2">
          {story.summary.split('\n')[0]}
        </p>

        {/* Action bar */}
        <div className="flex items-center gap-4">
          {/* Like */}
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 text-sm transition-all active:scale-110"
          >
            <span className={`text-xl ${liked ? 'scale-110' : 'opacity-70'}`}>
              {liked ? '❤️' : '🤍'}
            </span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-white/70 text-sm hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>

          {/* Read more */}
          <Link
            href={`/article/${story.id}`}
            onClick={() => onInteract('read', viewStartRef.current ? Math.round((Date.now() - viewStartRef.current) / 1000) : 0)}
            className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-white bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full transition-colors border border-white/20"
          >
            Read more
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Bias accent line at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-60"
        style={{ backgroundColor: accentColor }}
      />

      {sharing && <ShareSheet story={story} onClose={() => setSharing(false)} />}
    </div>
  );
}
