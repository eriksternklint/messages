'use client';
import type { PoliticalLean } from '@/types/news';
import { LEAN_ORDER, LEAN_LABEL, LEAN_COLOR } from '@/types/news';

interface Props {
  score: number; // -2 to +2
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function leanFromScore(score: number): PoliticalLean {
  if (score <= -1.5) return 'far-left';
  if (score <= -0.5) return 'left';
  if (score <= 0.5) return 'center';
  if (score <= 1.5) return 'right';
  return 'far-right';
}

export function BiasBar({ score, showLabel = true, size = 'md' }: Props) {
  // Convert score (-2 to +2) to position (0% to 100%)
  const pct = ((score + 2) / 4) * 100;
  const lean = leanFromScore(score);
  const color = LEAN_COLOR[lean];
  const label = LEAN_LABEL[lean];

  const barHeight = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">Far Left</span>
          <span className="text-xs font-semibold" style={{ color }}>
            {label}
          </span>
          <span className="text-xs text-gray-400">Far Right</span>
        </div>
      )}
      <div className={`relative w-full ${barHeight} rounded-full overflow-hidden`}>
        {/* Gradient track */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(to right, ${LEAN_COLOR['far-left']}, ${LEAN_COLOR['left']}, ${LEAN_COLOR['center']}, ${LEAN_COLOR['right']}, ${LEAN_COLOR['far-right']})`,
            opacity: 0.35,
          }}
        />
        {/* Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white shadow"
          style={{
            left: `${pct}%`,
            width: size === 'lg' ? '14px' : '10px',
            height: size === 'lg' ? '14px' : '10px',
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

interface LeanChipsProps {
  leans: PoliticalLean[];
}

export function LeanChips({ leans }: LeanChipsProps) {
  const unique = Array.from(new Set(leans)).sort(
    (a, b) => LEAN_ORDER.indexOf(a) - LEAN_ORDER.indexOf(b)
  );

  return (
    <div className="flex flex-wrap gap-1">
      {unique.map((lean) => (
        <span
          key={lean}
          className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
          style={{ backgroundColor: LEAN_COLOR[lean] + 'cc' }}
        >
          {LEAN_LABEL[lean]}
        </span>
      ))}
    </div>
  );
}
