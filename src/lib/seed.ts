import { useNodeStore } from '@/store';
import type { ActionItem, Agent, Channel, Message } from '@/types';

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
    },
    {
      id: 'ch:engineering',
      kind: 'channel',
      name: 'engineering',
      workspace: 'work',
      description: 'Platform and infra.',
      memberIds: ['u:you', 'u:alex', 'u:sam', 'u:mia'],
      lastMessageAt: mins(41),
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
