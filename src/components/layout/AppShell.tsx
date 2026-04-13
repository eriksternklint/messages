'use client';

import { useEffect } from 'react';

import { AIChatPanel } from '@/components/ai/AIChatPanel';
import { AISearchBar } from '@/components/ai/AISearchBar';
import { ThreadPanel } from '@/components/chat/ThreadPanel';
import { CreateModal } from '@/components/modals/CreateModal';
import { installAutoDemo } from '@/lib/agents/auto-demo';
import { installOrchestrator } from '@/lib/ai';
import { seedDevData } from '@/lib/seed';
import { useNodeStore } from '@/store';

import { LeftSidebar } from './LeftSidebar';
import { MainColumn } from './MainColumn';
import { RightSidebar } from './RightSidebar';
import { TopBar } from './TopBar';
import { ViewRail } from './ViewRail';
import { WorkspacePanel } from './WorkspacePanel';

/**
 * Top-level app shell. Layout: a thin view rail on the far left, a
 * channel sidebar, the main conversation column, and the task
 * sidebar on the right. A topbar sits above all three columns.
 * Floating overlays (workspace drawer, thread panel, AI chat, search
 * palette, create modal) render in their own portals over the grid.
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

    // Start the auto-demo loop — periodic inbound messages, replies,
    // new channel creation — so the app feels alive.
    installAutoDemo();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-zen-bg text-zen-ink overflow-hidden">
      <TopBar />
      <div className="flex-1 grid grid-cols-[56px_260px_minmax(0,1fr)_320px] min-h-0">
        <ViewRail />
        <LeftSidebar />
        <MainColumn />
        <RightSidebar />
      </div>

      {/* Floating overlays */}
      <WorkspacePanel />
      <ThreadPanel />
      <CreateModal />
      <AISearchBar />
      <AIChatPanel />
    </div>
  );
}
