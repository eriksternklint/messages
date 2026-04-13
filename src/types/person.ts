/**
 * A person in the user's organization. Used by the Create Chat /
 * Invite dialogs and rendered in channel member lists. Separate from
 * `Author`, which is the lightweight shape attached to messages.
 */
export interface Person {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  username?: string;
  title?: string;
  avatarUrl?: string;
  online?: boolean;
  addedAt: string;
}
