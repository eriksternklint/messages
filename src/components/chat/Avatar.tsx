import { cn, initials } from '@/lib/utils';

/**
 * Shared avatar component. Prefers an image when `avatarUrl` is set,
 * otherwise falls back to coloured initials using a deterministic hash
 * of the name — so every colleague keeps the same tint across renders.
 *
 * Four sizes map to the three call-sites: sm (20px) for feed rows,
 * md (28px) for message rows, lg (36px) for chat headers, and xl (48px)
 * for member directories and the marketplace.
 */
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE: Record<AvatarSize, string> = {
  sm: 'h-5 w-5 text-[9px]',
  md: 'h-7 w-7 text-[11px]',
  lg: 'h-9 w-9 text-[12px]',
  xl: 'h-12 w-12 text-[14px]',
};

// Warm, de-saturated palette so avatars stay calm inside the
// Notion-Zen surface without looking like a children's playground.
const PALETTE = [
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-800',
  'bg-emerald-100 text-emerald-800',
  'bg-sky-100 text-sky-800',
  'bg-violet-100 text-violet-800',
  'bg-indigo-100 text-indigo-800',
  'bg-teal-100 text-teal-800',
  'bg-fuchsia-100 text-fuchsia-800',
] as const;

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function Avatar({
  name,
  avatarUrl,
  size = 'md',
  online,
  kind,
  className,
}: {
  name: string;
  avatarUrl?: string;
  size?: AvatarSize;
  online?: boolean;
  kind?: 'human' | 'agent' | 'system';
  className?: string;
}) {
  const tone = PALETTE[hash(name) % PALETTE.length];
  const isAgent = kind === 'agent';

  return (
    <div
      className={cn(
        'relative rounded-full flex items-center justify-center font-semibold flex-shrink-0 overflow-hidden border border-zen-border',
        SIZE[size],
        isAgent ? 'bg-zen-ink text-white rounded-md' : tone,
        className,
      )}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{isAgent ? '◆' : initials(name)}</span>
      )}
      {online && (
        <span className="absolute -bottom-0 -right-0 h-2 w-2 rounded-full bg-emerald-500 border border-white" />
      )}
    </div>
  );
}
