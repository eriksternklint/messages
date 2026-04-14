/**
 * A person in the user's organization. Used by the Create Chat /
 * Invite dialogs, the Org Directory, and rendered in channel member
 * lists. Separate from `Author`, which is the lightweight shape
 * attached to messages.
 */
export interface Person {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  username?: string;
  title?: string;
  avatarUrl?: string;
  /** Tailwind color token used by the Avatar component fallback. */
  color?: 'rose' | 'amber' | 'emerald' | 'sky' | 'violet' | 'indigo' | 'teal' | 'fuchsia';
  online?: boolean;
  /** Team/department the person belongs to. Used by the Org Directory filter. */
  team?: string;
  /** Direct manager — links to another Person id. */
  managerId?: string;
  /** Seniority or role grade — "IC5", "Manager", "Director". */
  level?: string;
  /** Short bio / about-me rendered on the profile card. */
  bio?: string;
  /** Pronouns (she/her, he/him, they/them). */
  pronouns?: string;
  /** Office location or timezone (e.g. "London", "Remote — PST"). */
  location?: string;
  /** Personal interests / hobbies shown on profile. */
  interests?: string[];
  /** ISO datetime when the person joined the org. */
  startDate?: string;
  addedAt: string;
}
