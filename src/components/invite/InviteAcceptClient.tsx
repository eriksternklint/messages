'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import type { InvitePayload } from '@/lib/invites/token';

/**
 * Full-screen onboarding flow. The visitor lands here from an invite
 * link, sees who invited them and the workspace name, then fills out a
 * short form before we drop them into the main app. On submit we
 * bounce to `/` with the new-member payload in the query string — the
 * AppShell picks it up, adds them to the people directory, creates a
 * welcome channel, and marks them as the signed-in user.
 */

const AVATAR_COLORS: Array<{
  id: 'rose' | 'amber' | 'emerald' | 'sky' | 'violet' | 'indigo' | 'teal' | 'fuchsia';
  className: string;
}> = [
  { id: 'indigo', className: 'bg-indigo-500' },
  { id: 'emerald', className: 'bg-emerald-500' },
  { id: 'amber', className: 'bg-amber-500' },
  { id: 'rose', className: 'bg-rose-500' },
  { id: 'sky', className: 'bg-sky-500' },
  { id: 'violet', className: 'bg-violet-500' },
  { id: 'teal', className: 'bg-teal-500' },
  { id: 'fuchsia', className: 'bg-fuchsia-500' },
];

export function InviteAcceptClient({ payload }: { payload: InvitePayload }) {
  const router = useRouter();
  const [name, setName] = useState(payload.name ?? '');
  const [title, setTitle] = useState('');
  const [colorIdx, setColorIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length >= 2 && !submitting;

  function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    const joined = {
      name: name.trim(),
      email: payload.email,
      title: title.trim() || undefined,
      color: AVATAR_COLORS[colorIdx].id,
      workspace: payload.workspace ?? 'Node',
      invitedByName: payload.invitedByName,
    };
    const encoded = encodeURIComponent(JSON.stringify(joined));
    router.push(`/?joined=${encoded}`);
  }

  const initials = (name || payload.email).slice(0, 2).toUpperCase();

  return (
    <main className="min-h-screen flex items-center justify-center bg-zen-bg text-zen-ink px-4 py-10">
      <div className="w-full max-w-[440px]">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-lg bg-zen-accent text-white text-[14px] font-bold flex items-center justify-center">
            N
          </div>
          <span className="text-[13px] font-semibold tracking-tight">Node</span>
        </div>

        <div className="bg-white border border-zen-border rounded-xl shadow-zen-pop overflow-hidden">
          <div className="px-8 pt-8 pb-6 border-b border-zen-border bg-gradient-to-b from-white to-zen-canvas/60">
            <div className="text-[11px] uppercase tracking-widest text-zen-subtle font-semibold mb-2">
              You're invited
            </div>
            <h1 className="text-[24px] leading-[1.2] font-semibold text-zen-ink tracking-tight">
              {payload.invitedByName} invited you to{' '}
              <span className="text-zen-accent">{payload.workspace ?? 'Node'}</span>
            </h1>
            <p className="mt-3 text-[13px] text-zen-muted leading-relaxed">
              Claim your seat and you'll join the conversation instantly — messages,
              Notion pages, AI agents, all in one place.
            </p>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-zen-canvas border border-zen-border">
              <div
                className={cn(
                  'h-10 w-10 rounded-full text-white font-semibold text-[13px] flex items-center justify-center flex-shrink-0',
                  AVATAR_COLORS[colorIdx].className,
                )}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-zen-ink truncate">
                  {name.trim() || 'Your name'}
                </div>
                <div className="text-[11px] text-zen-subtle truncate">
                  {payload.email}
                </div>
              </div>
            </div>

            <Field label="Full name">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sasha Williams"
                className={inputClass}
              />
            </Field>

            <Field label="Role (optional)">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Product Designer"
                className={inputClass}
              />
            </Field>

            <Field label="Pick an avatar color">
              <div className="flex gap-1.5 flex-wrap">
                {AVATAR_COLORS.map((c, i) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setColorIdx(i)}
                    aria-label={c.id}
                    className={cn(
                      'h-7 w-7 rounded-full transition-transform',
                      c.className,
                      i === colorIdx
                        ? 'ring-2 ring-offset-2 ring-zen-ink scale-105'
                        : 'hover:scale-105',
                    )}
                  />
                ))}
              </div>
            </Field>

            <button
              disabled={!canSubmit}
              onClick={submit}
              className={cn(
                'w-full mt-6 h-11 rounded-lg text-[14px] font-semibold transition-colors shadow-zen-soft',
                canSubmit
                  ? 'bg-zen-ink text-white hover:bg-zen-accent'
                  : 'bg-zen-surface text-zen-subtle cursor-not-allowed',
              )}
            >
              {submitting ? 'Joining…' : `Join ${payload.workspace ?? 'Node'}`}
            </button>

            <div className="mt-4 text-[11px] text-zen-subtle text-center leading-relaxed">
              By joining, you agree that your name will be visible to everyone in
              the workspace.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-4">
      <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold mb-1.5">
        {label}
      </div>
      {children}
    </label>
  );
}

const inputClass =
  'w-full text-[14px] border border-zen-border rounded-lg px-3 py-2.5 bg-white outline-none focus:border-zen-ink/60 focus:shadow-zen-soft transition-colors placeholder:text-zen-subtle';
