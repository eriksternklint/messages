import type { Message, MessageBlock, NotionLiveBlock } from '@/types';

/**
 * Natural-language command interpreter for a Notion live page.
 *
 * When a user types a reply inside a thread whose parent message
 * contains a `notion-live-page` block, we try to interpret it as a
 * direct mutation of the page before falling back to posting it as a
 * regular thread reply. The supported grammar is intentionally narrow
 * so false positives stay rare:
 *
 *   • "add row Item | Owner | Amount" (pipes or commas)
 *   • "add row Buy coffee, Erik, 8"
 *   • "delete row 2" / "delete the last row"
 *   • "rename column Owner to Lead"
 *   • "add column Priority"
 *   • "add todo Book the venue"
 *   • "add paragraph Here's the plan…"
 *   • "add heading Summary"
 *   • "add bullet We shipped v2"
 *   • "check todo Book the venue"  (or "complete ...")
 *   • "uncheck todo Book the venue"
 *   • "rename page to Q2 Launch Plan"
 *   • "set title to Q2 Launch Plan"
 *
 * The runner mutates the FIRST `notion-live-page` block in the message
 * and returns both the new message shape and a short human summary the
 * thread composer can post back as an acknowledgement.
 */

type LivePage = Extract<MessageBlock, { type: 'notion-live-page' }>;

export interface LivePageCommandResult {
  /** The updated message — caller should dispatch `message.updated` with this. */
  message: Message;
  /** A short confirmation to post back into the thread as a system reply. */
  summary: string;
}

/**
 * Try to interpret `text` as a mutation against the first live page on
 * `parent`. Returns null if the text doesn't match any known pattern
 * or if the parent has no live page to mutate.
 */
export function tryRunLivePageCommand(
  text: string,
  parent: Message,
): LivePageCommandResult | null {
  const pageIdx = parent.blocks.findIndex((b) => b.type === 'notion-live-page');
  if (pageIdx < 0) return null;
  const page = parent.blocks[pageIdx] as LivePage;

  const trimmed = text.trim();
  if (!trimmed) return null;

  const mutation = parseCommand(trimmed, page);
  if (!mutation) return null;

  const nextPage = mutation.apply(page);
  const nextBlocks = parent.blocks.slice();
  nextBlocks[pageIdx] = nextPage;

  return {
    message: {
      ...parent,
      blocks: nextBlocks,
      editedAt: new Date().toISOString(),
    },
    summary: mutation.summary,
  };
}

interface Mutation {
  apply: (page: LivePage) => LivePage;
  summary: string;
}

function parseCommand(text: string, page: LivePage): Mutation | null {
  const lower = text.toLowerCase();

  // ─── Title ────────────────────────────────────────────────────────
  const titleMatch =
    /^(?:rename|set)\s+(?:the\s+)?(?:page|title)\s+(?:to\s+)?["']?(.+?)["']?$/i.exec(
      text,
    );
  if (titleMatch) {
    const newTitle = titleMatch[1].trim();
    return {
      apply: (p) => ({ ...p, title: newTitle }),
      summary: `Renamed page to “${newTitle}”.`,
    };
  }

  // ─── Table: add row ───────────────────────────────────────────────
  // "add row" | "add a row" | "insert row" followed by cells
  const addRowMatch =
    /^(?:add|insert)\s+(?:a\s+)?row\s*[:\-]?\s*(.+)$/i.exec(text);
  if (addRowMatch) {
    const table = findTable(page);
    if (!table) return null;
    const cellsText = addRowMatch[1];
    const parts = splitCells(cellsText);
    const cells: Record<string, string> = {};
    for (let i = 0; i < table.columns.length; i++) {
      cells[table.columns[i]] = parts[i] ?? '';
    }
    const newRow = { id: `r:${Date.now()}`, cells };
    return {
      apply: (p) =>
        mapBlocks(p, (b) =>
          b === table ? { ...table, rows: [...table.rows, newRow] } : b,
        ),
      summary: `Added a row to the table.`,
    };
  }

  // ─── Table: delete row ────────────────────────────────────────────
  const delRowLast = /^(?:delete|remove)\s+(?:the\s+)?last\s+row$/i.test(text);
  const delRowN = /^(?:delete|remove)\s+row\s+(\d+)$/i.exec(text);
  if (delRowLast || delRowN) {
    const table = findTable(page);
    if (!table || table.rows.length === 0) return null;
    const idx = delRowLast
      ? table.rows.length - 1
      : Math.max(0, parseInt(delRowN![1], 10) - 1);
    if (idx >= table.rows.length) return null;
    return {
      apply: (p) =>
        mapBlocks(p, (b) =>
          b === table
            ? { ...table, rows: table.rows.filter((_, i) => i !== idx) }
            : b,
        ),
      summary: `Deleted row ${idx + 1} from the table.`,
    };
  }

  // ─── Table: rename column ─────────────────────────────────────────
  const renameColMatch = /^rename\s+column\s+(.+?)\s+to\s+(.+)$/i.exec(text);
  if (renameColMatch) {
    const table = findTable(page);
    if (!table) return null;
    const oldName = renameColMatch[1].trim();
    const newName = renameColMatch[2].trim().replace(/^["']|["']$/g, '');
    const col = table.columns.find(
      (c) => c.toLowerCase() === oldName.toLowerCase(),
    );
    if (!col) return null;
    return {
      apply: (p) =>
        mapBlocks(p, (b) => {
          if (b !== table) return b;
          return {
            ...table,
            columns: table.columns.map((c) => (c === col ? newName : c)),
            rows: table.rows.map((r) => {
              const cells = { ...r.cells };
              cells[newName] = cells[col] ?? '';
              delete cells[col];
              return { ...r, cells };
            }),
          };
        }),
      summary: `Renamed column “${col}” to “${newName}”.`,
    };
  }

  // ─── Table: add column ────────────────────────────────────────────
  const addColMatch = /^add\s+column\s+(.+)$/i.exec(text);
  if (addColMatch) {
    const table = findTable(page);
    if (!table) return null;
    const name = addColMatch[1].trim().replace(/^["']|["']$/g, '');
    return {
      apply: (p) =>
        mapBlocks(p, (b) =>
          b === table
            ? {
                ...table,
                columns: [...table.columns, name],
                rows: table.rows.map((r) => ({
                  ...r,
                  cells: { ...r.cells, [name]: '' },
                })),
              }
            : b,
        ),
      summary: `Added column “${name}”.`,
    };
  }

  // ─── Todo: add / check / uncheck ──────────────────────────────────
  const addTodoMatch = /^add\s+(?:a\s+)?todo\s*[:\-]?\s*(.+)$/i.exec(text);
  if (addTodoMatch) {
    const todoText = addTodoMatch[1].trim();
    const newBlock: NotionLiveBlock = {
      id: `nb:${Date.now()}`,
      type: 'todo',
      text: todoText,
      checked: false,
    };
    return {
      apply: (p) => ({ ...p, blocks: [...p.blocks, newBlock] }),
      summary: `Added a to-do: “${todoText}”.`,
    };
  }

  const checkTodoMatch =
    /^(?:check|complete|finish)\s+(?:the\s+)?(?:todo\s+)?["']?(.+?)["']?$/i.exec(
      text,
    );
  if (checkTodoMatch && /todo|check|complete/i.test(lower)) {
    const needle = checkTodoMatch[1].trim().toLowerCase();
    const target = page.blocks.find(
      (b) => b.type === 'todo' && b.text.toLowerCase().includes(needle),
    );
    if (!target || target.type !== 'todo') return null;
    return {
      apply: (p) => ({
        ...p,
        blocks: p.blocks.map((b) =>
          b.id === target.id ? { ...target, checked: true } : b,
        ),
      }),
      summary: `Checked off “${target.text}”.`,
    };
  }

  const uncheckTodoMatch =
    /^uncheck\s+(?:the\s+)?(?:todo\s+)?["']?(.+?)["']?$/i.exec(text);
  if (uncheckTodoMatch) {
    const needle = uncheckTodoMatch[1].trim().toLowerCase();
    const target = page.blocks.find(
      (b) => b.type === 'todo' && b.text.toLowerCase().includes(needle),
    );
    if (!target || target.type !== 'todo') return null;
    return {
      apply: (p) => ({
        ...p,
        blocks: p.blocks.map((b) =>
          b.id === target.id ? { ...target, checked: false } : b,
        ),
      }),
      summary: `Unchecked “${target.text}”.`,
    };
  }

  // ─── Add paragraph / heading / bullet / callout / divider ─────────
  const addParagraph = /^add\s+(?:a\s+)?paragraph\s*[:\-]?\s*(.+)$/i.exec(text);
  if (addParagraph) {
    const content = addParagraph[1].trim();
    const nb: NotionLiveBlock = {
      id: `nb:${Date.now()}`,
      type: 'paragraph',
      text: content,
    };
    return {
      apply: (p) => ({ ...p, blocks: [...p.blocks, nb] }),
      summary: `Added a paragraph.`,
    };
  }

  const addHeading = /^add\s+(?:a\s+)?heading\s*[:\-]?\s*(.+)$/i.exec(text);
  if (addHeading) {
    const content = addHeading[1].trim();
    const nb: NotionLiveBlock = {
      id: `nb:${Date.now()}`,
      type: 'heading',
      level: 2,
      text: content,
    };
    return {
      apply: (p) => ({ ...p, blocks: [...p.blocks, nb] }),
      summary: `Added heading “${content}”.`,
    };
  }

  const addBullet =
    /^add\s+(?:a\s+)?(?:bullet|list\s+item)\s*[:\-]?\s*(.+)$/i.exec(text);
  if (addBullet) {
    const content = addBullet[1].trim();
    const nb: NotionLiveBlock = {
      id: `nb:${Date.now()}`,
      type: 'bullet',
      text: content,
    };
    return {
      apply: (p) => ({ ...p, blocks: [...p.blocks, nb] }),
      summary: `Added a bullet.`,
    };
  }

  const addCallout = /^add\s+(?:a\s+)?callout\s*[:\-]?\s*(.+)$/i.exec(text);
  if (addCallout) {
    const content = addCallout[1].trim();
    const nb: NotionLiveBlock = {
      id: `nb:${Date.now()}`,
      type: 'callout',
      emoji: '💡',
      text: content,
    };
    return {
      apply: (p) => ({ ...p, blocks: [...p.blocks, nb] }),
      summary: `Added a callout.`,
    };
  }

  if (/^add\s+(?:a\s+)?divider$/i.test(text)) {
    const nb: NotionLiveBlock = { id: `nb:${Date.now()}`, type: 'divider' };
    return {
      apply: (p) => ({ ...p, blocks: [...p.blocks, nb] }),
      summary: `Added a divider.`,
    };
  }

  return null;
}

function findTable(
  page: LivePage,
): Extract<NotionLiveBlock, { type: 'table' }> | undefined {
  return page.blocks.find((b): b is Extract<NotionLiveBlock, { type: 'table' }> =>
    b.type === 'table',
  );
}

function mapBlocks(
  page: LivePage,
  fn: (b: NotionLiveBlock) => NotionLiveBlock,
): LivePage {
  return { ...page, blocks: page.blocks.map(fn) };
}

function splitCells(text: string): string[] {
  if (text.includes('|')) return text.split('|').map((s) => s.trim());
  if (text.includes(',')) return text.split(',').map((s) => s.trim());
  // Fall back to whitespace-separated, but collapse runs.
  return text.split(/\s{2,}/).map((s) => s.trim());
}
