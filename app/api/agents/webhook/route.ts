import { NextResponse } from 'next/server';

import {
  normalizeAgentPush,
  type AgentPushPayload,
} from '@/lib/events/sources/agent';

/**
 * External agent webhook. This is the contract a 24/7 cloud agent
 * hits to proactively push updates into a Node channel — washup
 * reports, task completion notifications, etc.
 *
 * For the MVP the route validates the payload and echoes back the
 * normalized `InboundEvent`. In production it would fan the event
 * out to connected clients over SSE or WebSocket; for now the client
 * triggers the same code path directly via `triggerWashup()` so the
 * demo feedback loop is visible without infrastructure.
 */
export async function POST(req: Request) {
  let payload: AgentPushPayload;
  try {
    payload = (await req.json()) as AgentPushPayload;
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  if (
    !payload?.agentId ||
    !payload?.agentName ||
    !payload?.channelId ||
    !payload?.text ||
    !payload?.messageId ||
    !payload?.timestamp
  ) {
    return NextResponse.json(
      {
        error:
          'payload requires: agentId, agentName, channelId, messageId, timestamp, text',
      },
      { status: 400 },
    );
  }

  const event = normalizeAgentPush(payload);
  return NextResponse.json({ ok: true, event });
}
