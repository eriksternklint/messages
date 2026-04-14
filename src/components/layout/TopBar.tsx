'use client';

import { IconSearch, IconSparkle, IconUsers } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useNodeStore } from '@/store';

/**
 * Notion-ish top bar spanning the full width above the three columns.
 * Hosts the AI search trigger (Cmd+K), the Org Directory entry point,
 * and the AI Agent toggle that opens the right-sidebar agent.
 */
export function TopBar() {
  const setSearchOpen = useNodeStore((s) => s.setSearchOpen);
  const setOrgDirectoryOpen = useNodeStore((s) => s.setOrgDirectoryOpen);
  const toggleAIAgent = useNodeStore((s) => s.toggleAIAgent);
  const aiAgentOpen = useNodeStore((s) => s.aiAgentOpen);
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

      <div className="flex items-center gap-1">
        <button
          onClick={() => setOrgDirectoryOpen(true)}
          className="h-7 px-2 rounded-md flex items-center gap-1.5 text-[11px] text-zen-muted hover:text-zen-ink hover:bg-zen-surface transition-colors"
          title="Open the org directory"
        >
          <IconUsers className="h-3.5 w-3.5" />
          People
        </button>
        <button
          onClick={() => toggleAIAgent()}
          className={cn(
            'h-7 px-2.5 rounded-md flex items-center gap-1.5 text-[11px] font-medium border transition-colors',
            aiAgentOpen
              ? 'bg-zen-ink text-white border-zen-ink shadow-zen-soft'
              : 'bg-zen-accentSoft text-zen-ink border-zen-accent/30 hover:border-zen-accent',
          )}
          title="Open the AI Agent panel"
        >
          <IconSparkle className="h-3 w-3" />
          AI Agent
          {!aiAgentOpen && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>
    </header>
  );
}
