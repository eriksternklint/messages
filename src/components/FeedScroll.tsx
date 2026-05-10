'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { NewsStory, Interaction, Category } from '@/types/news';
import { FeedCard } from './FeedCard';

const STORAGE_KEY = 'prism_interactions';
const LIKED_KEY = 'prism_liked';

function loadInteractions(): Interaction[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Interaction[];
  } catch {
    return [];
  }
}

function saveInteraction(ix: Interaction) {
  if (typeof window === 'undefined') return;
  const existing = loadInteractions();
  existing.push(ix);
  // Keep only last 500 interactions
  const trimmed = existing.slice(-500);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

function loadLiked(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function toggleLiked(storyId: string, liked: boolean) {
  if (typeof window === 'undefined') return;
  const set = loadLiked();
  if (liked) set.add(storyId);
  else set.delete(storyId);
  localStorage.setItem(LIKED_KEY, JSON.stringify(Array.from(set)));
}

interface Props {
  initialStories: NewsStory[];
}

export function FeedScroll({ initialStories }: Props) {
  const [stories, setStories] = useState(initialStories);
  const [activeIndex, setActiveIndex] = useState(0);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setLiked(loadLiked());
  }, []);

  // Intersection Observer to track active card
  useEffect(() => {
    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = cards.indexOf(entry.target as HTMLDivElement);
            if (idx >= 0) setActiveIndex(idx);
          }
        }
      },
      { threshold: 0.6 }
    );
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, [stories]);

  const handleInteract = useCallback(
    (story: NewsStory, type: Interaction['type'], watchTime: number) => {
      const ix: Interaction = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        storyId: story.id,
        type,
        category: story.category as Category,
        biasScore: story.biasScore,
        watchTime,
        timestamp: new Date().toISOString(),
      };
      saveInteraction(ix);

      if (type === 'like') {
        setLiked((prev) => {
          const next = new Set(prev);
          if (next.has(story.id)) {
            next.delete(story.id);
            toggleLiked(story.id, false);
          } else {
            next.add(story.id);
            toggleLiked(story.id, true);
          }
          return next;
        });
      }
    },
    []
  );

  if (stories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh bg-zinc-950 text-white gap-4">
        <div className="text-5xl">📰</div>
        <p className="text-xl font-semibold">No stories yet</p>
        <p className="text-gray-400 text-sm text-center px-8">
          Trigger a feed refresh from the settings, or stories will load shortly.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-dvh overflow-y-scroll snap-y snap-mandatory scroll-smooth"
      style={{ scrollbarWidth: 'none' }}
    >
      {stories.map((story, idx) => (
        <div
          key={story.id}
          ref={(el) => { cardRefs.current[idx] = el; }}
          className="h-dvh w-full snap-start snap-always flex-shrink-0"
        >
          <FeedCard
            story={story}
            isActive={activeIndex === idx}
            isLiked={liked.has(story.id)}
            onInteract={(type, wt) => handleInteract(story, type, wt)}
          />
        </div>
      ))}

      {/* Scroll progress dots */}
      <div className="fixed right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20 pointer-events-none">
        {stories.map((_, idx) => (
          <div
            key={idx}
            className="rounded-full transition-all duration-200"
            style={{
              width: activeIndex === idx ? '6px' : '4px',
              height: activeIndex === idx ? '6px' : '4px',
              backgroundColor: activeIndex === idx ? 'white' : 'rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
