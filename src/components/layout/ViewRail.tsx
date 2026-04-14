'use client';

import {
  IconAt,
  IconCheck,
  IconHome,
  IconPencil,
  IconRobot,
  IconThread,
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { ViewMode } from '@/types';

/**
 * The slim vertical view switcher on the far left — Slack-style. Click
 * the top avatar to reveal the workspace drawer; the icons below swap
 * the primary view in the center pane. Each ViewMode maps to a full
 * sidebar+main pair in `AppShell`, so these clicks actually change
 * everything right of the rail.
 */
const VIEWS: Array<{
  id: ViewMode;
  label: string;
  Icon: typeof IconHome;
}> = [
  { id: 'home', label: 'Home', Icon: IconHome },
  { id: 'threads', label: 'Threads', Icon: IconThread },
  { id: 'mentions', label: 'Mentions', Icon: IconAt },
  { id: 'drafts', label: 'Drafts', Icon: IconPencil },
  { id: 'tasks', label: 'Tasks', Icon: IconCheck },
  { id: 'agents', label: 'Agents', Icon: IconRobot },
];

export function ViewRail() {
  const view = useNodeStore((s) => s.view);
  const setView = useNodeStore((s) => s.setView);
  const toggleWorkspacePanel = useNodeStore((s) => s.toggleWorkspacePanel);
  const workspacePanelOpen = useNodeStore((s) => s.workspacePanelOpen);

  return (
    <div className="h-full w-[60px] border-r border-zen-border bg-zen-ink flex flex-col items-center py-3 flex-shrink-0">
      <button
        onClick={toggleWorkspacePanel}
        className={cn(
          'h-9 w-9 rounded-md bg-white/10 text-white text-[13px] font-bold flex items-center justify-center mb-4 transition-colors hover:bg-white/20',
          workspacePanelOpen && 'ring-2 ring-zen-accent ring-offset-2 ring-offset-zen-ink',
        )}
        aria-label="Workspace menu"
        title="Workspace"
      >
        N
      </button>

      <div className="flex-1 flex flex-col items-center gap-1">
        {VIEWS.map(({ id, label, Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              title={label}
              aria-label={label}
              className={cn(
                'group relative h-10 w-10 rounded-md flex flex-col items-center justify-center transition-colors',
                active
                  ? 'bg-white/15 text-white'
                  : 'text-white/50 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className="text-[9px] mt-0.5 font-medium">{label}</span>
              <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-zen-ink px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-zen-pop border border-white/10">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
