/**
 * Stateless invite tokens — encode the entire invite payload directly
 * into a URL-safe string. A real product would use a signed HMAC so
 * nobody can forge invites, but for this demo a base64(JSON(...))
 * token is enough: it lives only inside the user's own workspace and
 * the accept page re-validates on the client anyway.
 */
export interface InvitePayload {
  email: string;
  invitedByName: string;
  invitedAt: string;
  workspace?: string;
  /** Optional suggested display name. */
  name?: string;
}

function base64urlEncode(input: string): string {
  if (typeof window !== 'undefined') {
    return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(input: string): string {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b64 = (input + pad).replace(/-/g, '+').replace(/_/g, '/');
  if (typeof window !== 'undefined') return atob(b64);
  return Buffer.from(b64, 'base64').toString('utf8');
}

export function encodeInviteToken(payload: InvitePayload): string {
  return base64urlEncode(JSON.stringify(payload));
}

export function decodeInviteToken(token: string): InvitePayload | null {
  try {
    const json = base64urlDecode(token);
    const parsed = JSON.parse(json) as InvitePayload;
    if (!parsed.email || !parsed.invitedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}
