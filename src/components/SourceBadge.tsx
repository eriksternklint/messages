'use client';
import type { PoliticalLean } from '@/types/news';
import { LEAN_LABEL, LEAN_COLOR } from '@/types/news';

interface Props {
  name: string;
  lean: PoliticalLean;
  url?: string;
  showLean?: boolean;
  size?: 'sm' | 'md';
}

export function SourceBadge({ name, lean, url, showLean = true, size = 'md' }: Props) {
  const color = LEAN_COLOR[lean];
  const leanLabel = LEAN_LABEL[lean];
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  const badge = (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/20 ${textSize} font-medium text-white`}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
        title={leanLabel}
      />
      {name}
      {showLean && (
        <span className="text-xs opacity-60" style={{ color }}>
          · {leanLabel}
        </span>
      )}
    </span>
  );

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
        {badge}
      </a>
    );
  }

  return badge;
}
