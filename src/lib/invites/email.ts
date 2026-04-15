/**
 * Render the HTML for an invite email. Returned by the server so the
 * invite modal can show a WYSIWYG preview of exactly what the invitee
 * will see in their inbox — no real SMTP required for the demo.
 *
 * The template is a single self-contained inline-styled block so it
 * renders identically in Gmail, Outlook web, Apple Mail, and the
 * in-app preview pane.
 */
export interface InviteEmailInput {
  email: string;
  invitedByName: string;
  workspaceName: string;
  acceptUrl: string;
}

export function renderInviteEmailHtml(input: InviteEmailInput): string {
  const { invitedByName, workspaceName, acceptUrl } = input;
  const esc = escapeHtml;
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f4f0;font-family:Inter,Segoe UI,system-ui,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e4dd;box-shadow:0 1px 2px rgba(30,30,30,0.04),0 8px 24px rgba(30,30,30,0.06);overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 16px 32px;">
                <div style="display:inline-flex;align-items:center;gap:10px;">
                  <div style="width:32px;height:32px;border-radius:8px;background:#1f6feb;color:#fff;font-weight:700;font-size:15px;display:inline-block;line-height:32px;text-align:center;">N</div>
                  <span style="font-size:13px;font-weight:600;color:#1a1a1a;letter-spacing:-0.01em;">Node</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 4px 32px;">
                <div style="font-size:22px;line-height:1.25;font-weight:600;color:#1a1a1a;letter-spacing:-0.01em;">
                  ${esc(invitedByName)} invited you to <span style="color:#1f6feb;">${esc(workspaceName)}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 24px 32px;">
                <div style="font-size:14px;line-height:1.6;color:#515151;">
                  Node is where ${esc(invitedByName)}'s team lives — Slack-speed chat, Notion-grade docs, and agents that
                  keep things moving. Click below to create your account. It takes 10 seconds.
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 32px 28px 32px;">
                <a href="${esc(acceptUrl)}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:-0.01em;">
                  Create your account →
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px 32px;border-top:1px solid #ece9df;">
                <div style="font-size:11px;line-height:1.6;color:#8a8a8a;">
                  Or copy this link into your browser:<br/>
                  <span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#515151;word-break:break-all;">${esc(acceptUrl)}</span>
                </div>
              </td>
            </tr>
          </table>
          <div style="font-size:11px;color:#a8a6a0;margin-top:16px;">
            You're receiving this because ${esc(invitedByName)} invited you to Node.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
