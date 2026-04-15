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
    <header className="h-11 border-b border-zen-border bg-zen-ink flex items-center px-3 gap-3 flex-shrink-0 text-white">
      <div className="flex items-center gap-1.5 text-[11px] text-white/60 font-medium">
        <div className="h-5 w-5 rounded bg-white/10 text-white text-[10px] font-bold flex items-center justify-center">
          N
        </div>
        <span className="text-white/90 font-semibold">Node</span>
        <span className="text-white/30">/</span>
        <span className="capitalize text-white/60">{mode}</span>
      </div>

      <button
        onClick={() => setSearchOpen(true)}
        className="flex-1 max-w-xl mx-auto h-7 flex items-center gap-2 px-3 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-[12px] text-white/70 transition-colors"
      >
        <IconSearch className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search messages, channels, or ask AI…</span>
        <kbd className="text-[10px] text-white/70 bg-white/10 border border-white/10 rounded px-1.5 py-0.5 font-sans">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setOrgDirectoryOpen(true)}
          className="h-7 px-2 rounded-md flex items-center gap-1.5 text-[11px] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
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
              ? 'bg-white text-zen-ink border-white shadow-zen-soft'
              : 'bg-white/10 text-white border-white/15 hover:bg-white/15',
          )}
          title="Open the AI Agent panel"
        >
          <IconSparkle className="h-3 w-3" />
          AI Agent
          {!aiAgentOpen && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          )}
        </button>
      </div>
    </header>
  );
}
