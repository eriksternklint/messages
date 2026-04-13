'use client';

import { useEffect } from 'react';

import {
  IconBriefcase,
  IconLayers,
  IconPlus,
  IconRobot,
  IconSettings,
  IconUser,
  IconUsers,
  IconX,
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { useNodeStore } from '@/store';
import type { WorkspaceMode } from '@/types';

const WORKSPACES: Array<{
  id: WorkspaceMode;
  label: string;
  description: string;
  Icon: typeof IconBriefcase;
}> = [
  {
    id: 'work',
    label: 'Work',
    description: 'Professional channels and Notion mirrors.',
    Icon: IconBriefcase,
  },
  {
    id: 'personal',
    label: 'Personal',
    description: 'WhatsApp chats and personal assistants.',
    Icon: IconUser,
  },
  {
    id: 'combined',
    label: 'Combined',
    description: 'One stream — everything, ranked by AI.',
    Icon: IconLayers,
  },
];

/**
 * Drawer that slides out from the left of the ViewRail. Holds the
 * workspace switcher and the top-level "create" entry points — the
 * only place in the UI that exposes multi-workspace identity.
 */
export function WorkspacePanel() {
  const open = useNodeStore((s) => s.workspacePanelOpen);
  const setOpen = useNodeStore((s) => s.setWorkspacePanelOpen);
  const mode = useNodeStore((s) => s.mode);
  const setMode = useNodeStore((s) => s.setMode);
  const openCreateModal = useNodeStore((s) => s.openCreateModal);

  // Dismiss on escape for feel.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <>
      {/* Click-off backdrop, transparent so we don't dim the UI. */}
      <div
        className="fixed inset-0 z-30"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-[56px] w-[300px] z-40',
          'bg-white border-r border-zen-border shadow-zen-pop',
          'flex flex-col animate-zen-fade',
        )}
      >
        <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-zen-border">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-zen-subtle">
              Workspace
            </div>
            <div className="text-sm font-semibold text-zen-ink mt-0.5">
              Node
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="h-7 w-7 rounded-md hover:bg-zen-surface flex items-center justify-center text-zen-muted"
            aria-label="Close"
          >
            <IconX className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="px-3 py-3 border-b border-zen-border">
          <div className="px-1 pb-1.5 text-[10px] uppercase tracking-wider text-zen-subtle font-medium">
            Mode
          </div>
          <ul className="space-y-0.5">
            {WORKSPACES.map(({ id, label, description, Icon }) => (
              <li key={id}>
                <button
                  onClick={() => {
                    setMode(id);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-start gap-2.5 px-2 py-2 rounded-md text-left transition-colors',
                    mode === id
                      ? 'bg-zen-surface'
                      : 'hover:bg-zen-surface/60',
                  )}
                >
                  <Icon className="h-4 w-4 text-zen-muted flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-zen-ink">
                      {label}
                    </div>
                    <div className="text-[11px] text-zen-subtle">
                      {description}
                    </div>
                  </div>
                  {mode === id && (
                    <div className="h-1.5 w-1.5 rounded-full bg-zen-accent mt-2 flex-shrink-0" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-3 py-3 border-b border-zen-border">
          <div className="px-1 pb-1.5 text-[10px] uppercase tracking-wider text-zen-subtle font-medium">
            Create
          </div>
          <ul className="space-y-0.5">
            <CreateButton
              label="New channel"
              Icon={IconPlus}
              onClick={() => {
                openCreateModal('new-channel');
                setOpen(false);
              }}
            />
            <CreateButton
              label="New chat"
              Icon={IconUsers}
              onClick={() => {
                openCreateModal('new-chat');
                setOpen(false);
              }}
            />
            <CreateButton
              label="Add a person"
              Icon={IconUser}
              onClick={() => {
                openCreateModal('new-person');
                setOpen(false);
              }}
            />
            <CreateButton
              label="Add an AI agent"
              Icon={IconRobot}
              onClick={() => {
                openCreateModal('new-agent');
                setOpen(false);
              }}
            />
          </ul>
        </div>

        <div className="flex-1" />

        <div className="border-t border-zen-border px-3 py-3">
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] text-zen-muted hover:bg-zen-surface/60 transition-colors">
            <IconSettings className="h-3.5 w-3.5" />
            Workspace settings
          </button>
        </div>
      </aside>
    </>
  );
}

function CreateButton({
  label,
  Icon,
  onClick,
}: {
  label: string;
  Icon: typeof IconPlus;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-zen-ink hover:bg-zen-surface/60 transition-colors"
      >
        <Icon className="h-3.5 w-3.5 text-zen-muted" />
        {label}
      </button>
    </li>
  );
}
