# Node

A conversational operating system. Replaces Slack; merges professional and
private execution into a single, minimalist UI. The metric is **Daily Active
Seconds** — open the app, execute an AI-drafted response, run a slash command
that mutates an external database, close the app.

> **Status:** Phase 1, Step 4 complete — Block-Level Chat View (Notion tables, galleries, action cards render inline in chat).

## Tech

- **Frontend:** Next.js 14 (App Router) + React + Tailwind CSS (Notion-Zen aesthetic)
- **State:** Zustand (sliced store, unidirectional event flow)
- **AI:** Anthropic Claude (Sonnet 4.6 / Opus 4.6) via `@anthropic-ai/sdk`
- **Notion:** `@notionhq/client` — real API calls (block sync + comments)
- **WhatsApp:** Mocked via DMA third-party chat interop contract
- **Desktop:** Tauri wrapper planned (web build first)

## Getting started

```bash
npm install
cp .env.example .env.local     # fill in secrets (Notion, Anthropic, etc.)
npm run dev                     # http://localhost:3000
```

## Architecture — unidirectional event flow

Every source funnels through a single entry point:

```
┌────────────────────┐   ┌────────────────────┐   ┌──────────────────┐
│ Notion webhook     │   │ WhatsApp (DMA mock)│   │ Agent webhook    │
└─────────┬──────────┘   └─────────┬──────────┘   └─────────┬────────┘
          │                        │                        │
          ▼                        ▼                        ▼
    ┌──────────────────── normalizers ────────────────────┐
    │   src/lib/events/sources/{notion,whatsapp,agent}.ts │
    └──────────────────────────┬──────────────────────────┘
                               │  InboundEvent
                               ▼
                   ┌────────────────────────┐
                   │  dispatch(event)       │  src/lib/events/bus.ts
                   └───────────┬────────────┘
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
       ┌──────────────────┐       ┌────────────────────┐
       │ store.applyEvent │       │ AI Orchestration   │
       │   (slice muts)   │       │ layer listeners    │
       └────────┬─────────┘       └────────────────────┘
                │
                ▼
          React re-renders
```

## Project layout

```
messages/
├── app/                         # Next.js App Router entry
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                 # renders <AppShell />
│   └── api/
│       ├── ai/draft/route.ts    # POST → Pre-Filled Response Engine
│       └── agents/webhook/route.ts  # POST → external agent push contract
├── src/
│   ├── components/              # UI — hand-rolled Tailwind, Notion-Zen look
│   │   ├── layout/
│   │   │   ├── AppShell.tsx     # three-column grid + dev seed
│   │   │   ├── LeftSidebar.tsx  # workspace switcher + channel list
│   │   │   ├── MainColumn.tsx   # channel header + messages + composer
│   │   │   └── RightSidebar.tsx # Global Task Sidebar (Notion mirror)
│   │   ├── chat/
│   │   │   ├── BlockRenderer.tsx    # dispatches MessageBlock → component
│   │   │   └── blocks/              # one renderer per block type
│   │   │       ├── TextBlock.tsx
│   │   │       ├── MarkdownBlock.tsx
│   │   │       ├── NotionPageRefBlock.tsx
│   │   │       ├── NotionBlockEmbed.tsx
│   │   │       ├── NotionTableBlock.tsx
│   │   │       ├── NotionGalleryBlock.tsx
│   │   │       ├── ActionCardBlock.tsx
│   │   │       └── FileBlock.tsx
│   │   ├── priority-feed/
│   │   │   └── PriorityFeed.tsx # Action / Waiting / FYI / Noise
│   │   ├── command/
│   │   │   └── CommandInput.tsx # Universal Slash Command palette
│   │   └── icons.tsx            # inline monochrome SVG icon set
│   ├── lib/
│   │   ├── utils.ts             # cn(), formatRelative(), initials()
│   │   ├── seed.ts              # dev-only store seed
│   │   ├── events/              # event bus + per-source normalizers
│   │   │   ├── bus.ts
│   │   │   └── sources/{notion,whatsapp,agent}.ts
│   │   ├── ai/                  # AI Orchestration Layer
│   │   │   ├── context.ts        # mock RAG / vector search
│   │   │   ├── intent.ts         # Ghost Tracking intent classifier
│   │   │   ├── draft-server.ts   # real Claude call + deterministic fallback
│   │   │   ├── draft-client.ts   # fetch wrapper for the draft API route
│   │   │   └── orchestrator.ts   # event bus listener — classify + draft
│   │   └── agents/              # Digital Workforce helpers
│   │       ├── washup.ts         # simulate a 24/7 agent proactive push
│   │       └── whatsapp-demo.ts  # inject a mock inbound WhatsApp event
│   ├── store/                   # Zustand root store + slices
│   │   ├── useNodeStore.ts
│   │   └── slices/
│   │       ├── messagesSlice.ts
│   │       ├── actionsSlice.ts
│   │       ├── workspaceSlice.ts
│   │       ├── agentsSlice.ts
│   │       └── priorityFeedSlice.ts
│   └── types/                   # normalized data model
│       ├── source.ts            # SourceKind, WorkspaceMode, PriorityBucket
│       ├── message.ts           # Message + MessageBlock + Author + AI meta
│       ├── action.ts            # ActionItem (Notion task mirror)
│       ├── channel.ts           # Channel (chat / notion-mirror / whatsapp-chat)
│       ├── agent.ts             # Agent (autonomous AI "Persons")
│       ├── event.ts             # InboundEvent discriminated union
│       └── index.ts
├── .env.example                 # committed template
├── .env.local                   # gitignored — your secrets
├── tailwind.config.ts
├── next.config.mjs
├── tsconfig.json
└── package.json
```

## Roadmap

- [x] **Step 1** — scaffolding, types, Zustand store, event bus, normalizers
- [x] **Step 2** — "Execution First" Dashboard UI (Priority Feed + command input)
- [x] **Step 3** — Mock Context Engine (pre-filled responses, agent washups)
- [x] **Step 4** — Block-level chat view (Notion tables/galleries/action cards in bubbles)
- [ ] Notion two-way sync (real webhooks + block injection)
- [ ] WhatsApp DMA mock stream
- [ ] Slash command engine (`/notion-page`, `/hs-update-deal`, ...)
- [ ] Agent Library marketplace
- [ ] Workspace switcher + AI persona swap
- [ ] Global Task Sidebar (2-way Notion task db mirror)
- [ ] Tauri desktop wrapper
