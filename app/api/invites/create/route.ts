import { NextResponse } from 'next/server';

import { renderInviteEmailHtml } from '@/lib/invites/email';
import { encodeInviteToken } from '@/lib/invites/token';

/**
 * Create an invite. The server is stateless — the entire invite
 * payload lives inside the token itself (base64-encoded JSON), so no
 * database is needed and the accept link keeps working even on a
 * cold serverless start. Returns the URL and a rendered HTML preview
 * of exactly what the invitee will receive so the inviter can see the
 * email before it's "sent".
 *
 * A real deployment would wire this into an SMTP provider (Postmark,
 * Resend, SES, etc.) — for the demo we just return the HTML and the
 * modal displays it in-app as a WYSIWYG preview.
 */
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      invitedByName?: string;
      workspaceName?: string;
      name?: string;
    };
    const email = (body?.email ?? '').trim();
    const invitedByName = (body?.invitedByName ?? 'A teammate').trim();
    const workspaceName = (body?.workspaceName ?? 'Node').trim();
    const name = (body?.name ?? '').trim() || undefined;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 },
      );
    }

    const token = encodeInviteToken({
      email,
      invitedByName,
      invitedAt: new Date().toISOString(),
      workspace: workspaceName,
      name,
    });

    const origin = new URL(req.url).origin;
    const acceptUrl = `${origin}/invite/${token}`;
    const emailHtml = renderInviteEmailHtml({
      email,
      invitedByName,
      workspaceName,
      acceptUrl,
    });

    return NextResponse.json({
      ok: true,
      token,
      acceptUrl,
      emailHtml,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? 'invite creation failed' },
      { status: 500 },
    );
  }
}
