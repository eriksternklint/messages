'use client';

import { useEffect, useRef, useState } from 'react';

import { IconSparkle } from '@/components/icons';
import { triggerWashup } from '@/lib/agents/washup';
import { injectWhatsAppDemo } from '@/lib/agents/whatsapp-demo';
import { useNodeStore } from '@/store';

/**
 * A small developer-only menu in the channel header for triggering
 * mocked external events against the running store. Gives an
 * interactive way to see the full pipeline fire:
 *   • inject WhatsApp inbound  → normalizer → event bus → store →
 *     orchestrator → intent classifier → (action?) draft → composer
 *     pre-fill
 *   • push agent washup         → same pipeline, buckets into FYI
 *
 * Will be hidden or gated behind a debug flag once real event sources
 * are wired in a later step.
 */
export function DemoActions({ channelId }: { channelId: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const setActiveChannel = useNodeStore((s) => s.setActiveChannel);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function run(fn: () => void | string | null) {
    const result = fn();
    if (typeof result === 'string') setActiveChannel(result);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-2 py-1 text-[11px] rounded-md border border-zen-border text-zen-muted hover:bg-zen-surface flex items-center gap-1.5 transition-colors"
      >
        <IconSparkle className="h-3 w-3" />
        Demo
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-zen-border rounded-lg shadow-sm overflow-hidden z-20">
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-zen-subtle border-b border-zen-border">
            Simulate inbound event
          </div>
          <ul>
            <li>
              <button
                onClick={() => run(() => triggerWashup(channelId))}
                className="w-full px-3 py-2.5 text-left hover:bg-zen-surface transition-colors"
              >
                <div className="text-[12px] text-zen-ink font-medium">
                  Push agent washup
                </div>
                <div className="text-[10px] text-zen-subtle mt-0.5">
                  PM Agent posts a daily report into this channel
                </div>
              </button>
            </li>
            <li>
              <button
                onClick={() => run(() => injectWhatsAppDemo(channelId))}
                className="w-full px-3 py-2.5 text-left hover:bg-zen-surface transition-colors border-t border-zen-border"
              >
                <div className="text-[12px] text-zen-ink font-medium">
                  Inject WhatsApp message
                </div>
                <div className="text-[10px] text-zen-subtle mt-0.5">
                  A random inbound DMA chat — orchestrator will
                  classify + draft a reply
                </div>
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
