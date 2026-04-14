import { useNodeStore } from '@/store';
import type { ActionItem, Agent, Channel, Message, Person } from '@/types';

import { generateOrgPeople } from './seed-people';

/**
 * Dev-only seed. Called once on AppShell mount when the store is empty.
 * Populates a believable slice of messages, channels, tasks, and agents
 * so the Priority Feed, channel list, and task sidebar render content.
 *
 * Real data lands here via the event bus + source normalizers once the
 * Notion / WhatsApp / Agent integrations are wired in Steps 3–4.
 */
export function seedDevData(): void {
  const store = useNodeStore.getState();
  const now = Date.now();
  const mins = (n: number) => new Date(now - n * 60_000).toISOString();

  const people: Person[] = [
    {
      id: 'u:alex',
      name: 'Alex Chen',
      title: 'Engineering Lead',
      email: 'alex@company.com',
      username: 'alex',
      online: true,
      color: 'emerald',
      avatarUrl:
        'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=128&h=128&fit=crop&crop=faces&auto=format&q=80',
      addedAt: new Date(now - 30 * 86_400_000).toISOString(),
    },
    {
      id: 'u:sam',
      name: 'Sam Patel',
      title: 'Founder',
      email: 'sam@company.com',
      username: 'sam',
      online: true,
      color: 'amber',
      avatarUrl:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=128&h=128&fit=crop&crop=faces&auto=format&q=80',
      addedAt: new Date(now - 60 * 86_400_000).toISOString(),
    },
    {
      id: 'u:mia',
      name: 'Mia Rao',
      title: 'Product Designer',
      email: 'mia@company.com',
      username: 'mia',
      online: false,
      color: 'rose',
      avatarUrl:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=128&h=128&fit=crop&crop=faces&auto=format&q=80',
      addedAt: new Date(now - 14 * 86_400_000).toISOString(),
    },
    {
      id: 'u:mom',
      name: 'Mom',
      phone: '+1 555 0100',
      addedAt: new Date(now - 90 * 86_400_000).toISOString(),
    },
    {
      id: 'u:john',
      name: 'John',
      phone: '+1 555 0142',
      addedAt: new Date(now - 45 * 86_400_000).toISOString(),
    },
    {
      id: 'u:kate',
      name: 'Kate',
      phone: '+1 555 0167',
      addedAt: new Date(now - 45 * 86_400_000).toISOString(),
    },
    {
      id: 'u:lily',
      name: 'Lily',
      phone: '+1 555 0181',
      addedAt: new Date(now - 45 * 86_400_000).toISOString(),
    },
    {
      id: 'u:you',
      name: 'You',
      title: 'Builder',
      username: 'you',
      online: true,
      addedAt: new Date(now - 120 * 86_400_000).toISOString(),
    },
  ];
  people.forEach((p) => store.addPerson(p));

  // Seed the wider org directory — 100 generated colleagues across
  // 8 teams. Their IDs (`u:p1`–`u:p100`) are stable so the auto-chatter
  // loop can target them across reloads.
  generateOrgPeople().forEach((p) => store.addPerson(p));

  const channels: Channel[] = [
    {
      id: 'ch:q2-roadmap',
      kind: 'notion-mirror',
      name: 'Q2 Roadmap',
      workspace: 'work',
      description: 'Live mirror of the Q2 planning page.',
      notionPageId: 'notion-page-q2',
      memberIds: ['u:you', 'u:alex', 'u:sam'],
      agentIds: ['agent:pm'],
      lastMessageAt: mins(12),
      starred: true,
      linkedNotionTables: [
        {
          id: 'lnt:q2-deliverables',
          title: 'Q2 Deliverables',
          url: 'https://www.notion.so/q2-deliverables',
          role: 'Source of truth',
        },
      ],
      pinnedLinks: [
        {
          id: 'pin:q2-doc',
          label: 'Q2 Planning doc',
          url: 'https://www.notion.so/q2-planning',
          kind: 'notion',
        },
        {
          id: 'pin:okr-template',
          label: 'OKR template',
          url: 'https://www.notion.so/okr-template',
          kind: 'notion',
        },
      ],
    },
    {
      id: 'ch:engineering',
      kind: 'channel',
      name: 'engineering',
      workspace: 'work',
      description: 'Platform and infra.',
      memberIds: ['u:you', 'u:alex', 'u:sam', 'u:mia'],
      lastMessageAt: mins(41),
      isPrivate: true,
      pinnedLinks: [
        {
          id: 'pin:eng-runbook',
          label: 'Runbook',
          url: 'https://www.notion.so/runbook',
          kind: 'notion',
        },
      ],
    },
    {
      id: 'ch:design',
      kind: 'channel',
      name: 'design',
      workspace: 'work',
      description: 'Product design critiques.',
      memberIds: ['u:you', 'u:mia', 'u:sam'],
      lastMessageAt: mins(52),
    },
    {
      id: 'wa:mom',
      kind: 'whatsapp-chat',
      name: 'Mom',
      workspace: 'personal',
      whatsappChatId: 'wa-mom',
      memberIds: ['u:you', 'u:mom'],
      lastMessageAt: mins(7),
    },
    {
      id: 'wa:gym-friends',
      kind: 'whatsapp-chat',
      name: 'Gym Friends',
      workspace: 'personal',
      whatsappChatId: 'wa-gym',
      memberIds: ['u:you', 'u:john', 'u:kate', 'u:lily'],
      lastMessageAt: mins(63),
    },
  ];
  channels.forEach((c) => store.upsertChannel(c));
  store.setActiveChannel('ch:q2-roadmap');

  const agents: Agent[] = [
    {
      id: 'agent:pm',
      name: 'PM Agent',
      persona: 'Project Manager',
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      systemPrompt:
        'You coordinate project work across Notion and Node channels.',
      tools: ['notion.search', 'notion.update_block', 'hubspot.update_deal'],
      workspaceIds: ['ws:work'],
      channelIds: ['ch:q2-roadmap', 'ch:engineering'],
      proactive: { enabled: true, frequency: 'daily' },
      installedAt: new Date(now - 7 * 86_400_000).toISOString(),
    },
  ];
  agents.forEach((a) => store.registerAgent(a));

  const messages: Message[] = [
    // ─── Action Required ──────────────────────────────────────────────
    {
      id: 'm:notion-1',
      source: 'notion',
      sourceRef: { externalId: 'notion-c-1' },
      channelId: 'ch:q2-roadmap',
      author: { id: 'u:alex', name: 'Alex Chen', kind: 'human' },
      createdAt: mins(12),
      blocks: [
        {
          type: 'text',
          content:
            'Can you review the Q2 OKRs by EOD? I flagged three items that need your input — the platform migration scope is the most urgent.',
        },
      ],
      rawText:
        'Can you review the Q2 OKRs by EOD? I flagged three items that need your input — the platform migration scope is the most urgent.',
      ai: {
        priority: 'action',
        intentTags: ['question', 'deadline'],
        draftedResponse:
          "Yes, I'll review this afternoon and leave comments directly on the doc. Platform migration scope looks OK at first glance — the concern is the Jan→Feb slip, not the scope itself.",
        contextSources: ['notion:q2-okrs', 'notion:platform-migration-doc'],
        confidence: 0.87,
      },
    },
    {
      id: 'm:wa-1',
      source: 'whatsapp',
      channelId: 'wa:mom',
      author: { id: 'u:mom', name: 'Mom', kind: 'human' },
      createdAt: mins(7),
      blocks: [
        {
          type: 'text',
          content:
            "Hi love — are you coming to dinner on Sunday? Need to know by tonight so I can tell the restaurant.",
        },
      ],
      rawText:
        "Hi love — are you coming to dinner on Sunday? Need to know by tonight so I can tell the restaurant.",
      ai: {
        priority: 'action',
        intentTags: ['question', 'deadline'],
        draftedResponse:
          "Yes, Sunday works — see you at 7. I'll bring wine.",
        contextSources: ['calendar:sunday-free'],
        confidence: 0.92,
      },
    },
    {
      id: 'm:hs-1',
      source: 'hubspot',
      channelId: 'ch:engineering',
      author: { id: 'u:sam', name: 'Sam Patel', kind: 'human' },
      createdAt: mins(28),
      blocks: [
        {
          type: 'text',
          content:
            'Acme Corp is asking about SOC2. Can we update the deal to "Procurement Review" and send them the security packet?',
        },
      ],
      rawText:
        'Acme Corp is asking about SOC2. Can we update the deal to "Procurement Review" and send them the security packet?',
      ai: {
        priority: 'action',
        intentTags: ['crm-update', 'document-request'],
        draftedResponse:
          'On it — moving Acme to Procurement Review and sending the SOC2 packet from Drive.',
        contextSources: ['hubspot:acme-deal', 'drive:soc2-packet'],
        confidence: 0.79,
      },
    },
    {
      id: 'm:notion-2',
      source: 'notion',
      channelId: 'ch:design',
      author: { id: 'u:mia', name: 'Mia Rao', kind: 'human' },
      createdAt: mins(52),
      blocks: [
        {
          type: 'text',
          content:
            'Left a few comments on the onboarding flow — can you take a look before the review on Thursday?',
        },
      ],
      rawText:
        'Left a few comments on the onboarding flow — can you take a look before the review on Thursday?',
      ai: {
        priority: 'action',
        intentTags: ['review-request', 'deadline'],
        draftedResponse:
          'Will do — walking through the comments now, will reply by Wednesday so you have a day before the review.',
        contextSources: ['notion:onboarding-spec'],
        confidence: 0.84,
      },
    },

    // ─── Thread demo ──────────────────────────────────────────────────
    {
      id: 'm:thread-1',
      source: 'notion',
      channelId: 'ch:q2-roadmap',
      threadId: 'm:notion-1',
      author: { id: 'u:sam', name: 'Sam Patel', kind: 'human' },
      createdAt: mins(10),
      blocks: [
        {
          type: 'text',
          content:
            '+1 on reviewing the platform migration scope — I think the Jan→Feb slip is what worries investors.',
        },
      ],
      rawText:
        '+1 on reviewing the platform migration scope — I think the Jan→Feb slip is what worries investors.',
      ai: { priority: 'fyi' },
    },
    {
      id: 'm:thread-2',
      source: 'notion',
      channelId: 'ch:q2-roadmap',
      threadId: 'm:notion-1',
      author: {
        id: 'agent:pm',
        name: 'PM Agent',
        kind: 'agent',
        agentPersona: 'Project Manager',
      },
      createdAt: mins(9),
      blocks: [
        {
          type: 'markdown',
          content:
            "I pulled the slip analysis — **2 of 5 items** shifted because of the vendor review. Suggesting we re-baseline Feb 1.",
        },
      ],
      rawText: 'Pulled the slip analysis. Suggesting we re-baseline Feb 1.',
      ai: { priority: 'fyi' },
    },

    // ─── Block-level content ──────────────────────────────────────────
    {
      id: 'm:block-table',
      source: 'notion',
      sourceRef: { externalId: 'notion-page-q2' },
      channelId: 'ch:q2-roadmap',
      author: {
        id: 'agent:pm',
        name: 'PM Agent',
        kind: 'agent',
        agentPersona: 'Project Manager',
      },
      createdAt: mins(18),
      blocks: [
        {
          type: 'text',
          content: 'Q2 deliverables — live mirror of the planning table.',
        },
        {
          type: 'notion-table',
          tableId: 'notion-table-q2',
          columns: ['Deliverable', 'Owner', 'Status', 'Due'],
          rows: [
            {
              Deliverable: 'Platform migration',
              Owner: 'Alex',
              Status: 'In progress',
              Due: 'May 14',
            },
            {
              Deliverable: 'Onboarding redesign',
              Owner: 'Mia',
              Status: 'Review',
              Due: 'Apr 28',
            },
            {
              Deliverable: 'SOC2 packet',
              Owner: 'Sam',
              Status: 'Blocked',
              Due: 'Apr 22',
            },
            {
              Deliverable: 'Agent marketplace spike',
              Owner: 'You',
              Status: 'Not started',
              Due: 'Jun 3',
            },
          ],
        },
        {
          type: 'notion-page-ref',
          pageId: 'notion-page-q2',
          title: 'Q2 Planning — full doc',
          url: 'https://www.notion.so/q2-planning',
        },
      ],
      rawText:
        'Q2 deliverables — live mirror of the planning table. Platform migration, Onboarding redesign, SOC2 packet, Agent marketplace spike.',
      ai: { priority: 'fyi' },
    },
    {
      id: 'm:live-page-launch',
      source: 'notion',
      sourceRef: { externalId: 'notion-live-launch' },
      channelId: 'ch:q2-roadmap',
      author: { id: 'u:sam', name: 'Sam Patel', kind: 'human' },
      createdAt: mins(11),
      blocks: [
        {
          type: 'text',
          content: 'Dropping the live launch page here — edit anything, agents will too.',
        },
        {
          type: 'notion-live-page',
          pageId: 'live:launch-prep',
          title: 'Launch prep — w/c Apr 21',
          icon: '🚀',
          url: 'https://www.notion.so/launch-prep',
          blocks: [
            {
              id: 'lp-h-1',
              type: 'heading',
              level: 2,
              text: 'Goals for the week',
            },
            {
              id: 'lp-p-1',
              type: 'paragraph',
              text: 'Get the staging build green, lock the launch copy, and confirm the day-of run of show.',
            },
            {
              id: 'lp-callout',
              type: 'callout',
              emoji: '⚠️',
              text: 'SOC2 packet is the long pole — sync with Sam before EOD Tuesday.',
            },
            {
              id: 'lp-todo-1',
              type: 'todo',
              text: 'Cut RC build and ship to staging',
              checked: true,
            },
            {
              id: 'lp-todo-2',
              type: 'todo',
              text: 'Lock launch blog copy with marketing',
              checked: false,
            },
            {
              id: 'lp-todo-3',
              type: 'todo',
              text: 'Schedule day-of run of show with on-call',
              checked: false,
            },
            {
              id: 'lp-budget',
              type: 'table',
              columns: ['Line item', 'Owner', 'Amount'],
              rows: [
                {
                  id: 'lp-b1',
                  cells: { 'Line item': 'Launch swag', Owner: 'Mia', Amount: '1200' },
                },
                {
                  id: 'lp-b2',
                  cells: { 'Line item': 'Press outreach', Owner: 'Sam', Amount: '850' },
                },
                {
                  id: 'lp-b3',
                  cells: { 'Line item': 'Demo video', Owner: 'Alex', Amount: '2400' },
                },
              ],
              hasFormulas: true,
            },
            {
              id: 'lp-code',
              type: 'code',
              language: 'bash',
              text: 'pnpm release --tag launch-w17\npnpm post-release --notify',
            },
          ],
        },
      ],
      rawText:
        'Launch prep — w/c Apr 21. Goals: green staging, locked copy, run of show. Live page with budget table.',
      ai: { priority: 'fyi' },
    },
    {
      id: 'm:block-gallery',
      source: 'notion',
      channelId: 'ch:design',
      author: { id: 'u:mia', name: 'Mia Rao', kind: 'human' },
      createdAt: mins(34),
      blocks: [
        {
          type: 'text',
          content:
            'Onboarding direction candidates — pick your favorite for the Thursday review.',
        },
        {
          type: 'notion-gallery',
          galleryId: 'notion-gallery-onboarding',
          items: [
            { id: 'g1', title: 'Minimal — 3 steps' },
            { id: 'g2', title: 'Guided tour' },
            { id: 'g3', title: 'Progressive disclosure' },
          ],
        },
        {
          type: 'action-card',
          title: 'Approve onboarding direction',
          description:
            'Locks the chosen variant and opens the hand-off Notion page for engineering.',
          actions: [
            {
              id: 'approve',
              label: 'Approve',
              command: '/notion-update-status approved',
            },
            {
              id: 'changes',
              label: 'Request changes',
              command: '/notion-comment',
            },
          ],
        },
      ],
      rawText:
        'Onboarding direction candidates — pick your favorite for the Thursday review.',
      ai: {
        priority: 'action',
        intentTags: ['review-request', 'decision'],
        draftedResponse:
          "Going with progressive disclosure — it matches the v2 info architecture and doesn't require a new first-run state.",
        contextSources: ['notion:onboarding-spec'],
        confidence: 0.81,
      },
    },

    // ─── FYI ──────────────────────────────────────────────────────────
    {
      id: 'm:agent-1',
      source: 'agent',
      channelId: 'ch:engineering',
      author: {
        id: 'agent:pm',
        name: 'PM Agent',
        kind: 'agent',
        agentPersona: 'Project Manager',
      },
      createdAt: mins(41),
      blocks: [
        {
          type: 'markdown',
          content:
            'Daily washup — 3 PRs merged, 1 open review blocked on QA, roadmap updated. Full report in Notion.',
        },
      ],
      rawText:
        'Daily washup — 3 PRs merged, 1 open review blocked on QA, roadmap updated.',
      ai: { priority: 'fyi' },
    },
    {
      id: 'm:notion-3',
      source: 'notion',
      channelId: 'ch:q2-roadmap',
      author: { id: 'u:sam', name: 'Sam Patel', kind: 'human' },
      createdAt: mins(95),
      blocks: [
        { type: 'text', content: 'FYI — bumped the roadmap doc to v2, same link.' },
      ],
      rawText: 'FYI — bumped the roadmap doc to v2, same link.',
      ai: { priority: 'fyi' },
    },
    {
      id: 'm:wa-2',
      source: 'whatsapp',
      channelId: 'wa:gym-friends',
      author: { id: 'u:john', name: 'John', kind: 'human' },
      createdAt: mins(63),
      blocks: [
        { type: 'text', content: "I'm running late — start without me." },
      ],
      rawText: "I'm running late — start without me.",
      ai: { priority: 'fyi' },
    },

    // ─── Waiting ──────────────────────────────────────────────────────
    {
      id: 'm:wait-1',
      source: 'node-dm',
      channelId: 'ch:engineering',
      author: { id: 'u:you', name: 'You', kind: 'human' },
      createdAt: mins(180),
      blocks: [
        {
          type: 'text',
          content: "I'll get back to you Friday with the migration plan.",
        },
      ],
      rawText: "I'll get back to you Friday with the migration plan.",
      ai: {
        priority: 'waiting',
        intentTags: ['commitment'],
        deferUntil: new Date(now + 3 * 86_400_000).toISOString(),
      },
    },
    {
      id: 'm:wait-2',
      source: 'notion',
      channelId: 'ch:q2-roadmap',
      author: { id: 'u:alex', name: 'Alex Chen', kind: 'human' },
      createdAt: mins(240),
      blocks: [
        { type: 'text', content: 'Waiting on legal review of the new vendor contract.' },
      ],
      rawText: 'Waiting on legal review of the new vendor contract.',
      ai: { priority: 'waiting', intentTags: ['blocker'] },
    },

    // ─── Noise ────────────────────────────────────────────────────────
    {
      id: 'm:noise-1',
      source: 'whatsapp',
      channelId: 'wa:gym-friends',
      author: { id: 'u:kate', name: 'Kate', kind: 'human' },
      createdAt: mins(320),
      blocks: [{ type: 'text', content: 'haha that is wild' }],
      rawText: 'haha that is wild',
      ai: { priority: 'noise' },
    },
    {
      id: 'm:noise-2',
      source: 'node-channel',
      channelId: 'ch:design',
      author: { id: 'u:mia', name: 'Mia Rao', kind: 'human' },
      createdAt: mins(420),
      blocks: [{ type: 'text', content: 'gm' }],
      rawText: 'gm',
      ai: { priority: 'noise' },
    },
  ];

  messages.forEach((m) => {
    store.ingestMessage(m);
    if (m.ai) store.assignToBucket(m.id, m.ai.priority);
  });

  const actions: ActionItem[] = [
    {
      id: 'task:1',
      title: 'Review Q2 OKRs doc',
      description: 'Platform migration scope + Jan→Feb slip.',
      status: 'open',
      dueAt: new Date(now + 8 * 3_600_000).toISOString(),
      createdFrom: { messageId: 'm:notion-1', source: 'notion' },
      notionTaskId: 'notion-task-1',
      priority: 'action',
      createdAt: mins(12),
      updatedAt: mins(12),
    },
    {
      id: 'task:2',
      title: 'Confirm Sunday dinner',
      status: 'open',
      dueAt: new Date(now + 6 * 3_600_000).toISOString(),
      createdFrom: { messageId: 'm:wa-1', source: 'whatsapp' },
      priority: 'action',
      createdAt: mins(7),
      updatedAt: mins(7),
    },
    {
      id: 'task:3',
      title: 'Send SOC2 packet to Acme',
      status: 'open',
      dueAt: new Date(now + 24 * 3_600_000).toISOString(),
      createdFrom: { messageId: 'm:hs-1', source: 'hubspot' },
      priority: 'action',
      createdAt: mins(28),
      updatedAt: mins(28),
    },
    {
      id: 'task:4',
      title: 'Migration plan for engineering',
      status: 'waiting',
      dueAt: new Date(now + 3 * 86_400_000).toISOString(),
      createdFrom: { messageId: 'm:wait-1', source: 'node-dm' },
      priority: 'waiting',
      createdAt: mins(180),
      updatedAt: mins(180),
    },
    {
      id: 'task:5',
      title: 'Ship onboarding redesign',
      status: 'done',
      priority: 'fyi',
      notionTaskId: 'notion-task-5',
      createdAt: mins(1440),
      updatedAt: mins(60),
    },
  ];
  actions.forEach((a) => store.addAction(a));
}
