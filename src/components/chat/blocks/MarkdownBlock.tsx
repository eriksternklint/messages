import type { MessageBlock } from '@/types';

type Block = Extract<MessageBlock, { type: 'markdown' }>;

/**
 * Minimal markdown renderer. We don't pull in a full parser — it would
 * bloat the bundle for what is, in practice, a small set of inline
 * constructs. This handles **bold**, `code`, and leading `-` bullets,
 * which cover ~90% of what agent washups and Notion mirrors emit.
 *
 * For richer content (tables, embeds) the normalizer should emit a
 * structured block type instead of cramming it into markdown.
 */
export function MarkdownBlock({ block }: { block: Block }) {
  const lines = block.content.split('\n');
  return (
    <div className="text-[13px] text-zen-ink leading-relaxed space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trimStart();
        if (trimmed.startsWith('- ')) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-zen-subtle">•</span>
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }
        if (line === '') return <div key={i} className="h-1" />;
        return <div key={i}>{renderInline(line)}</div>;
      })}
    </div>
  );
}

/**
 * Inline pass: split on **bold** and `code` markers and wrap them.
 * Regex is greedy-safe because we split on the marker itself and toggle
 * state, not try to match pairs.
 */
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-medium text-zen-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded bg-zen-surface border border-zen-border text-[12px] font-mono text-zen-ink"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
