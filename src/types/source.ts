/**
 * Every message or event in Node originates from one of these sources.
 * The normalization layer converts raw payloads from each into the
 * unified {@link Message} / {@link InboundEvent} shapes.
 */
export type SourceKind =
  | 'notion' //         Notion page comments / block updates
  | 'whatsapp' //       Mocked DMA third-party chat (private workspace)
  | 'node-channel' //   Native Node channel (business workspace)
  | 'node-dm' //        Native Node direct message
  | 'agent' //          Autonomous AI agent push
  | 'system' //         System-generated (task, reminder, onboarding)
  | 'hubspot' //        HubSpot CRM
  | 'google'; //        Google Workspace (Gmail/Calendar/Drive)

/**
 * The three user-facing workspace modes in the sidebar toggle.
 * Switching modes swaps the AI agent persona (PM vs. Lifestyle Assistant).
 */
export type WorkspaceMode = 'work' | 'personal' | 'combined';

/**
 * AI priority classification used by the Priority Feed.
 * Replaces traditional unread-dot notifications.
 */
export type PriorityBucket = 'action' | 'fyi' | 'noise' | 'waiting';

/**
 * The primary navigation views in the left rail. Each view swaps the
 * main column layout — "home" is the default channel timeline backed by
 * a Slack-style home sidebar (starred, channels, DMs, agents,
 * integrations), "threads" is a flat feed of thread replies, "tasks"
 * pivots the tasks database into the main column, "agents" pivots to
 * the agent marketplace.
 */
export type ViewMode =
  | 'home'
  | 'inbox'
  | 'threads'
  | 'tasks'
  | 'mentions'
  | 'drafts'
  | 'agents';
