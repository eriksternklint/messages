'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  IconCheck,
  IconSparkle,
  IconUsers,
  IconX,
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { useNodeStore } from '@/store';

/**
 * Invite-by-email modal. The inviter types an email, optionally a
 * display name, hits send. The server mints a stateless invite token
 * and returns:
 *
 *   • the accept URL the recipient would click in their inbox
 *   • a fully-rendered HTML preview of the email so we can show it
 *     inline as a WYSIWYG "Here's what they'll receive" panel
 *
 * The inviter can copy the link directly for demo purposes or flip
 * into the email preview to see exactly what lands in the inbox.
 */
interface CreatedInvite {
  email: string;
  acceptUrl: string;
  emailHtml: string;
}

export function InviteModal() {
  const open = useNodeStore((s) => s.inviteModalOpen);
  const setOpen = useNodeStore((s) => s.setInviteModalOpen);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedInvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<'link' | 'email'>('link');

  const validEmail = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email],
  );

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setOpen(false);
    // Reset after exit so re-opening starts clean.
    setTimeout(() => {
      setEmail('');
      setName('');
      setCreated(null);
      setError(null);
      setCopied(false);
      setSubmitting(false);
      setView('link');
    }, 150);
  }

  async function send() {
    if (!validEmail || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/invites/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          invitedByName: 'Erik',
          workspaceName: 'Node',
        }),
      });
      if (!res.ok) {
        const detail = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(detail.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        acceptUrl: string;
        emailHtml: string;
      };
      setCreated({
        email: email.trim(),
        acceptUrl: data.acceptUrl,
        emailHtml: data.emailHtml,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.acceptUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // no-op
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
      <div
        className="absolute inset-0 bg-zen-ink/20 backdrop-blur-[2px]"
        onClick={close}
      />
      <div
        className={cn(
          'relative w-full bg-white rounded-xl border border-zen-border shadow-zen-pop animate-zen-pop-in overflow-hidden',
          created ? 'max-w-[720px]' : 'max-w-md',
        )}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-zen-border">
          <div className="flex items-center gap-2 text-sm font-semibold text-zen-ink">
            <IconUsers className="h-4 w-4 text-zen-muted" />
            {created ? 'Invite sent' : 'Invite teammates'}
          </div>
          <button
            onClick={close}
            className="h-7 w-7 rounded-md hover:bg-zen-surface flex items-center justify-center text-zen-muted"
            aria-label="Close"
          >
            <IconX className="h-3.5 w-3.5" />
          </button>
        </div>

        {!created ? (
          <div className="p-5">
            <div className="flex items-center gap-3 mb-5 p-3 rounded-lg bg-zen-accentSoft/60 border border-zen-accent/20">
              <div className="h-8 w-8 rounded-md bg-zen-accent/15 text-zen-accent flex items-center justify-center flex-shrink-0">
                <IconSparkle className="h-4 w-4" />
              </div>
              <div className="text-[12px] text-zen-muted leading-relaxed">
                We'll send them a polished welcome email with a single click to
                join <span className="font-semibold text-zen-ink">Node</span>.
                They become a full workspace member as soon as they accept.
              </div>
            </div>

            <label className="block mb-3">
              <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold mb-1.5">
                Email address
              </div>
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && validEmail) send();
                }}
                placeholder="sasha@company.com"
                className={inputClass}
              />
            </label>

            <label className="block mb-4">
              <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold mb-1.5">
                Name (optional)
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sasha Williams"
                className={inputClass}
              />
            </label>

            {error && (
              <div className="mb-3 text-[12px] text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              disabled={!validEmail || submitting}
              onClick={send}
              className={cn(
                'w-full h-10 rounded-lg text-[13px] font-semibold transition-colors shadow-zen-soft',
                validEmail && !submitting
                  ? 'bg-zen-ink text-white hover:bg-zen-accent'
                  : 'bg-zen-surface text-zen-subtle cursor-not-allowed',
              )}
            >
              {submitting ? 'Sending invite…' : 'Send invite'}
            </button>

            <div className="mt-3 text-[11px] text-zen-subtle text-center">
              You can also just share the link that gets generated.
            </div>
          </div>
        ) : (
          <div className="p-5">
            <div className="mb-4 flex items-center gap-2 text-[12px] text-emerald-700">
              <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <IconCheck className="h-3 w-3 text-emerald-700" />
              </div>
              <span>
                Invite for <strong>{created.email}</strong> is ready.
              </span>
            </div>

            <div className="flex items-center gap-1 border border-zen-border rounded-lg p-0.5 mb-4 bg-zen-canvas w-fit">
              <TabButton
                active={view === 'link'}
                onClick={() => setView('link')}
                label="Invite link"
              />
              <TabButton
                active={view === 'email'}
                onClick={() => setView('email')}
                label="Email preview"
              />
            </div>

            {view === 'link' ? (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold mb-1.5">
                  Accept URL
                </div>
                <div className="flex items-stretch gap-2">
                  <input
                    readOnly
                    value={created.acceptUrl}
                    className="flex-1 text-[12px] font-mono border border-zen-border rounded-lg px-3 py-2 bg-zen-canvas text-zen-ink outline-none"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <button
                    onClick={copyLink}
                    className={cn(
                      'px-4 rounded-lg text-[12px] font-semibold transition-colors',
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zen-ink text-white hover:bg-zen-accent',
                    )}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="mt-3 text-[11px] text-zen-subtle leading-relaxed">
                  Share this link by any channel — Slack, iMessage, sticky note on
                  their laptop. When they click it, they'll see the welcome
                  screen, create their account, and land in your workspace.
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <a
                    href={created.acceptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 px-4 rounded-lg border border-zen-border text-[12px] font-medium text-zen-ink bg-white hover:bg-zen-canvas transition-colors flex items-center"
                  >
                    Preview onboarding page
                  </a>
                  <button
                    onClick={close}
                    className="h-9 px-4 rounded-lg text-[12px] font-medium text-zen-muted hover:bg-zen-surface transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zen-subtle font-semibold mb-1.5">
                  What lands in their inbox
                </div>
                <div className="rounded-lg border border-zen-border overflow-hidden bg-zen-canvas">
                  <iframe
                    title="Email preview"
                    srcDoc={created.emailHtml}
                    className="w-full h-[420px] border-0 bg-white"
                    sandbox=""
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-7 px-3 rounded-md text-[12px] font-medium transition-colors',
        active
          ? 'bg-white text-zen-ink shadow-zen-soft border border-zen-border'
          : 'text-zen-muted hover:text-zen-ink',
      )}
    >
      {label}
    </button>
  );
}

const inputClass =
  'w-full text-[14px] border border-zen-border rounded-lg px-3 py-2.5 bg-white outline-none focus:border-zen-ink/60 focus:shadow-zen-soft transition-colors placeholder:text-zen-subtle';
