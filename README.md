# Node

A conversational operating system. Replaces Slack; merges professional and
private execution into a single, minimalist UI. The metric is **Daily Active
Seconds** — open the app, execute an AI-drafted response, run a slash command
that mutates an external database, close the app.

> **Status:** Phase 1, Step 1 complete — scaffolding + state layer.

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
│   └── page.tsx                 # placeholder — Step 2 will replace
├── src/
│   ├── types/                   # normalized data model
│   │   ├── source.ts            # SourceKind, WorkspaceMode, PriorityBucket
│   │   ├── message.ts           # Message + MessageBlock + Author + AI meta
│   │   ├── action.ts            # ActionItem (Notion task mirror)
│   │   ├── channel.ts           # Channel (chat / notion-mirror / whatsapp-chat)
│   │   ├── agent.ts             # Agent (autonomous AI "Persons")
│   │   ├── event.ts             # InboundEvent discriminated union
│   │   └── index.ts
│   ├── store/                   # Zustand root store + slices
│   │   ├── useNodeStore.ts      # combined store, applyEvent reducer
│   │   ├── slices/
│   │   │   ├── messagesSlice.ts
│   │   │   ├── actionsSlice.ts
│   │   │   ├── workspaceSlice.ts
│   │   │   ├── agentsSlice.ts
│   │   │   └── priorityFeedSlice.ts
│   │   └── index.ts
│   └── lib/
│       └── events/              # the event bus + per-source normalizers
│           ├── bus.ts
│           ├── sources/
│           │   ├── notion.ts
│           │   ├── whatsapp.ts
│           │   └── agent.ts
│           └── index.ts
├── .env.example                 # committed template
├── .env.local                   # gitignored — your secrets
├── tailwind.config.ts
├── next.config.mjs
├── tsconfig.json
└── package.json
```

## Roadmap

- [x] **Step 1** — scaffolding, types, Zustand store, event bus, normalizers
- [ ] **Step 2** — "Execution First" Dashboard UI (Priority Feed + command input)
- [ ] **Step 3** — Mock Context Engine (pre-filled responses, agent washups)
- [ ] **Step 4** — Block-level chat view (render Notion tables/galleries in bubbles)
- [ ] Notion two-way sync (real webhooks + block injection)
- [ ] WhatsApp DMA mock stream
- [ ] Slash command engine (`/notion-page`, `/hs-update-deal`, ...)
- [ ] Agent Library marketplace
- [ ] Workspace switcher + AI persona swap
- [ ] Global Task Sidebar (2-way Notion task db mirror)
- [ ] Tauri desktop wrapper
