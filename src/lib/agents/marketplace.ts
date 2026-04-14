import type { Message } from '@/types';

/**
 * The hard-coded agent marketplace catalog. The MVP shows these in the
 * Agents view; installing one calls `registerAgent` in the store and
 * dispatches a mock "hello" message into the caller's active channel.
 * Real listings will land on a server endpoint later, but the shape
 * already matches what that endpoint will return.
 */
export interface MarketplaceListing {
  id: string;
  name: string;
  publisher: string;
  version: string;
  tagline: string;
  description: string;
  category: 'writing' | 'research' | 'productivity' | 'engineering' | 'custom';
  tools: string[];
  /** The Claude skill file a user would upload to customize this agent. */
  skillHandle: string;
  /** Demo output the agent produces when `Try it` is clicked. */
  demo: {
    userPrompt: string;
    response: Message['blocks'];
  };
  /** Set when this listing is seeded into the store already. */
  installed?: boolean;
}

export const MARKETPLACE: MarketplaceListing[] = [
  {
    id: 'mkt:copywriter-seo',
    name: 'Copy & SEO Writer',
    publisher: 'Node official',
    version: '1.2.0',
    tagline: 'Drafts landing copy backed by SEO keyword data.',
    description:
      'Generates landing page copy in your brand voice, enriched with the top 5 SEO keywords for your target query. Ships with a mock "publish to landing page" tool that opens a preview.',
    category: 'writing',
    tools: ['seo.rank_keywords', 'landing.preview', 'notion.create_page'],
    skillHandle: 'claude-skills/copy-seo',
    demo: {
      userPrompt: 'Write a hero section for "team planning software".',
      response: [
        {
          type: 'markdown',
          content:
            '**Headline:** Plan weeks in minutes, not days.\n\n**Subheadline:** Team Planning that keeps roadmaps, standups, and standby calls in one place — so nobody has to ask "what are we doing today?" again.\n\n**CTA:** Start planning free',
        },
        {
          type: 'notion-table',
          tableId: 'mkt-demo-seo',
          columns: ['Keyword', 'Volume', 'Difficulty', 'Intent'],
          rows: [
            {
              Keyword: 'team planning software',
              Volume: '8,100',
              Difficulty: 'Medium',
              Intent: 'Commercial',
            },
            {
              Keyword: 'sprint planning tool',
              Volume: '2,400',
              Difficulty: 'Low',
              Intent: 'Commercial',
            },
            {
              Keyword: 'agile roadmap',
              Volume: '4,800',
              Difficulty: 'Medium',
              Intent: 'Informational',
            },
            {
              Keyword: 'team calendar app',
              Volume: '5,500',
              Difficulty: 'Medium',
              Intent: 'Commercial',
            },
            {
              Keyword: 'ops planning software',
              Volume: '1,100',
              Difficulty: 'Low',
              Intent: 'Commercial',
            },
          ],
        },
        {
          type: 'action-card',
          title: 'Publish landing page preview',
          description:
            'Opens a mocked landing page with this copy in your brand template.',
          actions: [
            {
              id: 'publish',
              label: 'Open preview',
              command: '/mkt-preview',
            },
          ],
        },
      ],
    },
  },
  {
    id: 'mkt:social-writer',
    name: 'Social Post Writer',
    publisher: 'Node official',
    version: '0.8.1',
    tagline: 'Writes social posts informed by mock trend research.',
    description:
      'Turns a topic into a three-platform thread (LinkedIn, X, Instagram), pulling mock trend data first so the angle is on-brief. Perfect for weekly social cadence.',
    category: 'writing',
    tools: ['social.research', 'social.draft', 'social.schedule'],
    skillHandle: 'claude-skills/social-writer',
    demo: {
      userPrompt: 'Draft a post on "async teamwork".',
      response: [
        {
          type: 'markdown',
          content:
            '**Trend radar**\n- 3.2× mentions week-over-week for "async standup"\n- Top voices: Lenny Rachitsky, Julie Zhuo\n- Hook angle: offices forcing a return are *talking* about hybrid but *measuring* sync time.\n\n**LinkedIn draft**\nAsync isn\'t about fewer meetings. It\'s about fewer *unnecessary* meetings. The rule we use at Node: if the thread can\'t survive 24h without a reply, it probably deserved a call in the first place.\n\n**X draft**\nAsync teamwork isn\'t "no meetings". It\'s "meetings that earn their place". Everything else belongs in a doc.\n\n**Instagram caption**\nFocus > facetime. Swipe for the 4 rituals we run async ↓',
        },
        {
          type: 'action-card',
          title: 'Schedule for Monday 9am',
          description:
            'Mock send to all three platforms at the next best post time.',
          actions: [
            { id: 'schedule', label: 'Schedule', command: '/mkt-schedule' },
          ],
        },
      ],
    },
  },
  {
    id: 'mkt:meeting-scribe',
    name: 'Meeting Scribe',
    publisher: 'Node official',
    version: '1.0.0',
    tagline: 'Turns raw transcripts into decisions + follow-ups.',
    description:
      'Listen to a meeting, spit out the 5 decisions made and who owns the follow-up. Writes the summary back into the linked Notion page.',
    category: 'productivity',
    tools: ['notion.append', 'calendar.read', 'transcribe.open'],
    skillHandle: 'claude-skills/meeting-scribe',
    demo: {
      userPrompt: 'Summarize yesterday\'s planning call.',
      response: [
        {
          type: 'markdown',
          content:
            '**Decisions**\n1. Ship the Q2 migration on Feb 14, not Jan 31.\n2. Mia owns the onboarding redesign through review.\n3. SOC2 packet goes out by Apr 22.\n\n**Follow-ups**\n- Alex — write migration runbook (Fri)\n- Sam — call Acme procurement (Mon)\n- You — review Q2 OKRs (EOD)',
        },
      ],
    },
  },
  {
    id: 'mkt:code-reviewer',
    name: 'Code Reviewer',
    publisher: 'Community',
    version: '0.4.2',
    tagline: 'Reviews PRs against your team style guide.',
    description:
      'Checks the diff against your team\'s lint rules + taste guide and leaves inline comments. Ships with a small default rubric; customize via a Claude skill.',
    category: 'engineering',
    tools: ['github.read_pr', 'github.comment'],
    skillHandle: 'claude-skills/reviewer',
    demo: {
      userPrompt: 'Review PR #412.',
      response: [
        {
          type: 'markdown',
          content:
            '**2 suggestions · 1 nit**\n\n`src/events/bus.ts:42` — use `queueMicrotask` instead of `setTimeout(fn, 0)` here. Keeps us inside the same tick.\n\n`src/store/applyEvent.ts:88` — this branch can never run because `event.kind` was narrowed on line 71. Safe to delete.\n\n_nit_: trailing comma style inconsistent in the same file.',
        },
      ],
    },
  },
];
