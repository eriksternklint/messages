'use client';

import { useEffect } from 'react';

import { installOrchestrator } from '@/lib/ai';
import { seedDevData } from '@/lib/seed';
import { useNodeStore } from '@/store';

import { LeftSidebar } from './LeftSidebar';
import { MainColumn } from './MainColumn';
import { RightSidebar } from './RightSidebar';

/**
 * The three-column shell. Column widths are fixed left/right and a
 * flexible center with `minmax(0, 1fr)` so long message text doesn't
 * blow out the grid.
 */
export function AppShell() {
  useEffect(() => {
    // Install the AI Orchestration Layer listener first so any events
    // produced by the dev seed (if we later choose to dispatch them)
    // or by the user's demo actions flow through it.
    installOrchestrator();

    // Seed dev data once, iff the store is empty. Uses getState() so
    // this effect does not resubscribe when state changes. Seed calls
    // store mutators directly (not dispatch), so the orchestrator
    // listener does not fire on seed data.
    if (Object.keys(useNodeStore.getState().messagesById).length === 0) {
      seedDevData();
    }
  }, []);

  return (
    <div className="h-screen grid grid-cols-[288px_minmax(0,1fr)_320px] bg-zen-bg text-zen-ink overflow-hidden">
      <LeftSidebar />
      <MainColumn />
      <RightSidebar />
    </div>
  );
}
