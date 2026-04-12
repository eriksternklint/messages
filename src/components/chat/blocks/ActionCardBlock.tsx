'use client';

import { IconLightning } from '@/components/icons';
import type { MessageBlock } from '@/types';

type Block = Extract<MessageBlock, { type: 'action-card' }>;

/**
 * An inline action card — "Approve / Request changes" style prompts
 * that let the user execute a slash command without leaving the
 * thread. Clicking a button logs the intent for now; in a later step
 * it will dispatch the slash command through the command bus.
 */
export function ActionCardBlock({ block }: { block: Block }) {
  function handleClick(actionId: string, command?: string) {
    // Placeholder wiring: real command dispatch lands when the slash
    // command engine ships. For now we log so demos show the intent.
    // eslint-disable-next-line no-console
    console.log('[action-card]', { actionId, command });
  }

  return (
    <div className="rounded-md border border-zen-border bg-white overflow-hidden">
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zen-subtle mb-1">
          <IconLightning className="h-2.5 w-2.5" />
          Action required
        </div>
        <div className="text-[13px] font-medium text-zen-ink">
          {block.title}
        </div>
        {block.description && (
          <div className="text-[12px] text-zen-muted mt-0.5 leading-relaxed">
            {block.description}
          </div>
        )}
      </div>
      <div className="flex gap-1.5 px-3 pb-3">
        {block.actions.map((action, i) => (
          <button
            key={action.id}
            onClick={() => handleClick(action.id, action.command)}
            className={
              i === 0
                ? 'px-3 py-1.5 text-[11.5px] rounded-md bg-zen-ink text-white hover:bg-zen-accent transition-colors'
                : 'px-3 py-1.5 text-[11.5px] rounded-md border border-zen-border text-zen-muted hover:bg-zen-surface transition-colors'
            }
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
