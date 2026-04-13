'use client';

import { IconSearch, IconSparkle } from '@/components/icons';
import { useNodeStore } from '@/store';

/**
 * Notion-ish top bar spanning the full width above the three columns.
 * Hosts the AI search trigger (Cmd+K opens the palette) and a discreet
 * AI status chip.
 */
export function TopBar() {
  const setSearchOpen = useNodeStore((s) => s.setSearchOpen);
  const mode = useNodeStore((s) => s.mode);

  return (
    <header className="h-11 border-b border-zen-border bg-zen-bg flex items-center px-4 gap-3 flex-shrink-0">
      <div className="text-[11px] text-zen-subtle flex items-center gap-1.5">
        <span className="capitalize">{mode}</span>
        <span className="text-zen-strong">/</span>
        <span className="text-zen-muted">Node</span>
      </div>

      <button
        onClick={() => setSearchOpen(true)}
        className="flex-1 max-w-xl mx-auto h-7 flex items-center gap-2 px-3 rounded-md border border-zen-border bg-zen-canvas hover:bg-zen-surface text-[12px] text-zen-subtle transition-colors"
      >
        <IconSearch className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search or ask the AI anything…</span>
        <kbd className="text-[10px] text-zen-subtle bg-white border border-zen-border rounded px-1.5 py-0.5 font-sans">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-1.5 text-[11px] text-zen-muted">
        <IconSparkle className="h-3 w-3" />
        AI on
      </div>
    </header>
  );
}
