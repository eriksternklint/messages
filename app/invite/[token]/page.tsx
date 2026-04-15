import { InviteAcceptClient } from '@/components/invite/InviteAcceptClient';
import { decodeInviteToken } from '@/lib/invites/token';

/**
 * The invite accept landing page. Renders a full-screen onboarding
 * experience — the inviter's name, the workspace, and a single form
 * that captures the new user's display name before dropping them into
 * the main app. The payload is pulled from the token directly, which
 * means no database round-trip and the link works from any device.
 */
export default function InviteAcceptPage({
  params,
}: {
  params: { token: string };
}) {
  const payload = decodeInviteToken(params.token);

  if (!payload) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zen-bg text-zen-ink">
        <div className="max-w-md px-6 text-center">
          <div className="text-[11px] uppercase tracking-widest text-zen-subtle mb-2">
            Invite invalid
          </div>
          <h1 className="text-2xl font-semibold mb-2">
            This invite link is broken or expired.
          </h1>
          <p className="text-[14px] text-zen-muted">
            Ask whoever invited you to send a fresh link.
          </p>
        </div>
      </main>
    );
  }

  return <InviteAcceptClient payload={payload} />;
}
