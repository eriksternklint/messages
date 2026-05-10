'use client';
import { useState } from 'react';
import type { NewsStory } from '@/types/news';

interface Props {
  story: NewsStory;
  onClose: () => void;
}

interface Platform {
  name: string;
  icon: string;
  color: string;
  getUrl: (text: string, url: string) => string;
}

const PLATFORMS: Platform[] = [
  {
    name: 'X (Twitter)',
    icon: '𝕏',
    color: '#000000',
    getUrl: (text, url) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: 'WhatsApp',
    icon: '💬',
    color: '#25D366',
    getUrl: (text, url) =>
      `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`,
  },
  {
    name: 'Instagram',
    icon: '📸',
    color: '#E1306C',
    getUrl: (_text, url) =>
      // Instagram doesn't have a direct share URL — copy to clipboard instead
      `#instagram:${url}`,
  },
  {
    name: 'TikTok',
    icon: '🎵',
    color: '#010101',
    getUrl: (_text, url) => `#tiktok:${url}`,
  },
];

export function ShareSheet({ story, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const storyUrl = `${appUrl}/article/${story.id}`;
  const shareText = `📰 ${story.headline}\n\nRead the full, balanced story on Prism:`;

  async function copyLink() {
    await navigator.clipboard.writeText(storyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareNative() {
    if (navigator.share) {
      await navigator.share({
        title: story.headline,
        text: shareText,
        url: storyUrl,
      });
      onClose();
    }
  }

  function handlePlatform(platform: Platform) {
    const url = platform.getUrl(shareText, storyUrl);
    if (url.startsWith('#instagram:') || url.startsWith('#tiktok:')) {
      // Copy link + instruction
      navigator.clipboard.writeText(storyUrl);
      alert(`Link copied! Paste it in your ${platform.name} story or bio.`);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-900 rounded-t-2xl p-6 pb-10 border-t border-white/10">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-semibold">Share via Prism</p>
        <p className="text-white font-semibold text-sm mb-5 line-clamp-2">{story.headline}</p>

        <div className="grid grid-cols-4 gap-3 mb-5">
          {PLATFORMS.map((p) => (
            <button
              key={p.name}
              onClick={() => handlePlatform(p)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span className="text-2xl">{p.icon}</span>
              <span className="text-xs text-gray-300 text-center leading-tight">{p.name}</span>
            </button>
          ))}
        </div>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={shareNative}
            className="w-full py-3 rounded-xl bg-white/10 text-white text-sm font-medium mb-3 hover:bg-white/15 transition-colors"
          >
            More options…
          </button>
        )}

        <button
          onClick={copyLink}
          className="w-full py-3 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          {copied ? '✓ Link copied!' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}
