'use client';
import { useState, useEffect } from 'react';
import type { Category } from '@/types/news';
import { LEAN_COLOR, CATEGORY_EMOJI } from '@/types/news';
import { BiasBar } from './BiasBar';

interface ProfileData {
  biasScore: number;
  biasLabel: string;
  upToDatePct: number;
  topCategories: Array<{ category: Category; score: number; pct: number }>;
  storiesViewed: number;
  storiesRead: number;
  totalReadTime: number;
  likedStories: string[];
}

interface Interaction {
  id: string;
  storyId: string;
  type: string;
  category: string;
  biasScore: number;
  watchTime: number;
  timestamp: string;
}

export function ProfileView() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [interactions, setInteractions] = useState<Interaction[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('prism_interactions');
      const ixs: Interaction[] = raw ? JSON.parse(raw) : [];
      setInteractions(ixs);
      fetchProfile(ixs);
    } catch {
      fetchProfile([]);
    }
  }, []);

  async function fetchProfile(ixs: Interaction[]) {
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interactions: ixs }),
      });
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  function clearHistory() {
    if (!confirm('Reset your reading history? This cannot be undone.')) return;
    localStorage.removeItem('prism_interactions');
    localStorage.removeItem('prism_liked');
    fetchProfile([]);
    setInteractions([]);
  }

  function formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
  }

  const empty = interactions.length === 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-6 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <h1 className="text-2xl font-bold mb-1">Your Profile</h1>
        <p className="text-gray-400 text-sm">Your reading habits, visualized without judgment.</p>
      </div>

      <div className="px-5 space-y-5 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Up to date */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-3">How Up to Date</p>
              <div className="flex items-end gap-3">
                <span
                  className="text-5xl font-black"
                  style={{ color: data && data.upToDatePct >= 70 ? '#22c55e' : data && data.upToDatePct >= 40 ? '#f59e0b' : '#ef4444' }}
                >
                  {data?.upToDatePct ?? 0}%
                </span>
                <span className="text-gray-400 text-sm pb-1">of today's stories</span>
              </div>
              <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${data?.upToDatePct ?? 0}%`,
                    backgroundColor: data && data.upToDatePct >= 70 ? '#22c55e' : data && data.upToDatePct >= 40 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
            </div>

            {/* Reading stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Viewed', value: data?.storiesViewed ?? 0, icon: '👁' },
                { label: 'Read', value: data?.storiesRead ?? 0, icon: '📖' },
                { label: 'Read time', value: formatTime(data?.totalReadTime ?? 0), icon: '⏱' },
              ].map((stat) => (
                <div key={stat.label} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div className="text-xl mb-1">{stat.icon}</div>
                  <div className="text-lg font-bold">{stat.value}</div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Coverage bias */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-3">Your Coverage Spectrum</p>
              {empty ? (
                <p className="text-gray-500 text-sm">Read some stories to see your spectrum.</p>
              ) : (
                <>
                  <BiasBar score={data?.biasScore ?? 0} size="lg" />
                  <p className="text-center text-sm text-gray-300 mt-2 font-medium">
                    {data?.biasLabel ?? 'Balanced'}
                  </p>
                  <p className="text-center text-xs text-gray-500 mt-1">
                    Based on your reading time across sources. Diverse reading is healthy.
                  </p>
                </>
              )}
            </div>

            {/* Top categories */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-3">Your Top Categories</p>
              {empty || !data?.topCategories?.length ? (
                <p className="text-gray-500 text-sm">Read some stories to see your categories.</p>
              ) : (
                <div className="space-y-3">
                  {data.topCategories.map(({ category, pct }) => (
                    <div key={category} className="flex items-center gap-3">
                      <span className="text-lg w-7 text-center">{CATEGORY_EMOJI[category as Category]}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium capitalize">{category}</span>
                          <span className="text-xs text-gray-400">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Note about personalization */}
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20">
              <p className="text-xs uppercase tracking-wider text-amber-400 font-semibold mb-2">How Your Feed Works</p>
              <p className="text-gray-300 text-sm leading-relaxed">
                Your feed is personalized by <strong>topic and category</strong>, never by political lean.
                We deliberately mix sources from across the spectrum so you always see the full picture.
                No filter bubbles here.
              </p>
            </div>

            {/* Reset */}
            <button
              onClick={clearHistory}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm hover:bg-white/10 hover:text-gray-200 transition-colors"
            >
              Reset reading history
            </button>
          </>
        )}
      </div>
    </div>
  );
}
