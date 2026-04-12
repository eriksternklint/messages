/**
 * Autonomous AI agents that live inside the workspace as "Persons".
 * Users can DM them, add them to channels, or install them from the
 * Agent Library marketplace.
 */
export interface Agent {
  id: string;
  name: string;
  avatarUrl?: string;
  /** Human-readable role: "Project Manager", "Lifestyle Assistant", etc. */
  persona: string;
  provider: 'anthropic' | 'openai' | 'custom';
  model?: string;
  systemPrompt?: string;
  /** MCP tool names this agent is allowed to invoke. */
  tools?: string[];
  workspaceIds: string[];
  channelIds: string[];
  /** Proactive reporting — 24/7 cloud agents pushing washups on a schedule. */
  proactive?: {
    enabled: boolean;
    frequency: 'hourly' | 'daily' | 'weekly';
    /** External webhook that pushes InboundEvents back into Node. */
    webhookUrl?: string;
  };
  /** Marketplace metadata when installed from the Agent Library. */
  marketplace?: {
    listingId: string;
    publisher: string;
    version: string;
  };
  installedAt: string;
}
