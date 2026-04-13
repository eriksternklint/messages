'use client';

import {
  IconAt,
  IconCheck,
  IconInbox,
  IconPencil,
  IconPlus,
  IconThread,
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { ViewMode } from '@/types';

/**
 * The slim vertical view switcher on the far left — Slack-style.
 * Click the top avatar to reveal the workspace drawer; the icons below
 * swap the primary view in the main column.
 */
const VIEWS: Array<{
  id: ViewMode;
  label: string;
  Icon: typeof IconInbox;
}> = [
  { id: 'inbox', label: 'Inbox', Icon: IconInbox },
  { id: 'threads', label: 'Threads', Icon: IconThread },
  { id: 'tasks', label: 'Tasks', Icon: IconCheck },
  { id: 'mentions', label: 'Mentions', Icon: IconAt },
  { id: 'drafts', label: 'Drafts', Icon: IconPencil },
];

export function ViewRail() {
  const view = useNodeStore((s) => s.view);
  const setView = useNodeStore((s) => s.setView);
  const toggleWorkspacePanel = useNodeStore((s) => s.toggleWorkspacePanel);
  const workspacePanelOpen = useNodeStore((s) => s.workspacePanelOpen);
  const openCreateModal = useNodeStore((s) => s.openCreateModal);

  return (
    <div className="h-full w-[56px] border-r border-zen-border bg-zen-canvas flex flex-col items-center py-3 flex-shrink-0">
      <button
        onClick={toggleWorkspacePanel}
        className={cn(
          'h-8 w-8 rounded-md bg-zen-ink text-white text-[11px] font-semibold flex items-center justify-center mb-4 transition-transform hover:scale-105 shadow-zen-soft',
          workspacePanelOpen && 'ring-2 ring-zen-accent ring-offset-2 ring-offset-zen-canvas',
        )}
        aria-label="Workspace menu"
        title="Workspace"
      >
        N
      </button>

      <div className="flex-1 flex flex-col items-center gap-1.5">
        {VIEWS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            title={label}
            aria-label={label}
            className={cn(
              'group relative h-9 w-9 rounded-md flex items-center justify-center transition-colors',
              view === id
                ? 'bg-zen-surface text-zen-ink'
                : 'text-zen-muted hover:bg-zen-surface/70 hover:text-zen-ink',
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-zen-ink px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-zen-soft">
              {label}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={() => openCreateModal('new-chat')}
        title="New"
        aria-label="New"
        className="h-9 w-9 rounded-md flex items-center justify-center text-zen-muted hover:bg-zen-surface/70 hover:text-zen-ink transition-colors"
      >
        <IconPlus className="h-4 w-4" />
      </button>
    </div>
  );
}
