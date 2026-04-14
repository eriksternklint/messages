'use client';

import { useEffect } from 'react';

import { AISearchBar } from '@/components/ai/AISearchBar';
import { CreateModal } from '@/components/modals/CreateModal';
import { StartChatModal } from '@/components/modals/StartChatModal';
import { installAutoDemo } from '@/lib/agents/auto-demo';
import { installPeopleChatter } from '@/lib/agents/people-chatter';
import { installOrchestrator } from '@/lib/ai';
import { seedDevData } from '@/lib/seed';
import { useNodeStore } from '@/store';

import { ContextSidebar } from './ContextSidebar';
import { OrgDirectory } from './OrgDirectory';
import { TopBar } from './TopBar';
import { ViewRail } from './ViewRail';
import { WorkspacePanel } from './WorkspacePanel';
import { AgentsView } from './views/AgentsView';
import { DraftsView } from './views/DraftsView';
import { HomeView } from './views/HomeView';
import { MentionsView } from './views/MentionsView';
import { TasksView } from './views/TasksView';
import { ThreadsView } from './views/ThreadsView';

/**
 * Top-level app shell. The outer grid is a thin view rail on the far
 * left; to its right the CurrentView renders its own sidebar + main
 * column pair (Home, Tasks, Threads, Mentions, Drafts, Agents). The
 * ContextSidebar on the far right is conditional on there being
 * something context-worthy to show (a thread, an AI draft, agent state).
 */
export function AppShell() {
  const view = useNodeStore((s) => s.view);

  useEffect(() => {
    installOrchestrator();
    if (Object.keys(useNodeStore.getState().messagesById).length === 0) {
      seedDevData();
    }
    installAutoDemo();
    installPeopleChatter();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-zen-bg text-zen-ink overflow-hidden">
      <TopBar />
      <div className="flex-1 flex min-h-0">
        <ViewRail />
        <CurrentView view={view} />
        <ContextSidebar />
      </div>

      {/* Floating overlays */}
      <WorkspacePanel />
      <CreateModal />
      <StartChatModal />
      <OrgDirectory />
      <AISearchBar />
    </div>
  );
}

function CurrentView({ view }: { view: string }) {
  switch (view) {
    case 'tasks':
      return <TasksView />;
    case 'threads':
      return <ThreadsView />;
    case 'mentions':
      return <MentionsView />;
    case 'drafts':
      return <DraftsView />;
    case 'agents':
      return <AgentsView />;
    case 'home':
    case 'inbox':
    default:
      return <HomeView />;
  }
}
