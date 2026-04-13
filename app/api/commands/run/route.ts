import { NextResponse } from 'next/server';

import { runSlashCommand } from '@/lib/commands/runner';

/**
 * Slash-command execution endpoint. The client composer POSTs the
 * raw command text plus the active channel id; the server runs the
 * side-effect (Notion API today, more integrations later) and returns
 * a `Message` to append to the channel as the system acknowledgement.
 *
 * Forces the Node.js runtime — `@notionhq/client` uses `node:fetch`
 * polyfills under the hood that don't run on the Edge runtime.
 */
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = typeof body?.text === 'string' ? body.text : '';
    const channelId = typeof body?.channelId === 'string' ? body.channelId : '';
    if (!text.startsWith('/') || !channelId) {
      return NextResponse.json(
        { error: 'text (slash command) and channelId are required' },
        { status: 400 },
      );
    }
    const result = await runSlashCommand(text, channelId);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/commands/run] error', err);
    return NextResponse.json(
      { error: (err as Error).message ?? 'command failed' },
      { status: 500 },
    );
  }
}
