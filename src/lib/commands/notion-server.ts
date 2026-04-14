/**
 * Server-side Notion adapter for slash commands.
 *
 * Lazily imports `@notionhq/client` so the `notion` SDK only ends up
 * in the server bundle when the route handler that depends on it
 * gets built. Reads `NOTION_API_KEY` from env on every call — there's
 * no caching layer because slash commands are infrequent.
 *
 * Actions we support today:
 *  - create-page         → POST a new page under NOTION_DEFAULT_PARENT_ID
 *                          and populate it with heading + paragraph +
 *                          checklist + table + callout blocks so it
 *                          lands as a real working doc, not a stub.
 *  - append-paragraph    → append a paragraph block to that page
 *  - append-todo         → append a to_do checkbox block
 *  - append-table        → append a 4-column starter table block
 *  - search              → call the Notion search API and return hits
 *
 * Everything returns a structured `{ ok, ... }` shape so the runner can
 * produce a clean ack message without try/catching inside the UI.
 */

export type NotionAction =
  | { kind: 'create-page'; title: string }
  | { kind: 'append-paragraph'; text: string }
  | { kind: 'append-todo'; text: string }
  | { kind: 'append-table'; title: string }
  | { kind: 'search'; query: string };

export type NotionActionResult =
  | {
      ok: true;
      kind: 'page';
      pageId: string;
      title: string;
      url: string;
    }
  | {
      ok: true;
      kind: 'block';
      pageId: string;
      pageTitle: string;
      url: string;
      summary: string;
    }
  | {
      ok: true;
      kind: 'search';
      results: Array<{ id: string; title: string; url: string }>;
    }
  | { ok: false; error: string };

export async function runNotionAction(
  action: NotionAction,
): Promise<NotionActionResult> {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error:
        'NOTION_API_KEY is not set on the server. Add it in Vercel project settings and redeploy.',
    };
  }

  let Client: typeof import('@notionhq/client').Client;
  try {
    ({ Client } = await import('@notionhq/client'));
  } catch (err) {
    return {
      ok: false,
      error: `Failed to load @notionhq/client: ${(err as Error).message}`,
    };
  }
  const notion = new Client({ auth: apiKey });

  try {
    if (action.kind === 'create-page') {
      const parentId = process.env.NOTION_DEFAULT_PARENT_ID;
      if (!parentId) {
        const fallback = await firstAvailableParent(notion);
        if (!fallback) {
          return {
            ok: false,
            error:
              'NOTION_DEFAULT_PARENT_ID is not set and no shared pages were found. Share a page with your integration in Notion or set NOTION_DEFAULT_PARENT_ID.',
          };
        }
        return await createPage(notion, fallback, action.title);
      }
      return await createPage(notion, parentId, action.title);
    }

    if (action.kind === 'append-paragraph') {
      return await appendTo(notion, paragraphBlock(action.text), 'Appended paragraph');
    }

    if (action.kind === 'append-todo') {
      return await appendTo(notion, todoBlock(action.text), 'Added to-do');
    }

    if (action.kind === 'append-table') {
      return await appendTo(notion, tableBlock(action.title), 'Added starter table');
    }

    if (action.kind === 'search') {
      const res = await notion.search({
        query: action.query,
        page_size: 10,
        filter: { value: 'page', property: 'object' },
      });
      const results = (res.results as unknown[]).map((r) => {
        const obj = r as { id: string; url?: string };
        return {
          id: obj.id,
          title: extractTitle(r) ?? 'Untitled',
          url: obj.url ?? '',
        };
      });
      return { ok: true, kind: 'search', results };
    }

    return { ok: false, error: 'Unknown Notion action' };
  } catch (err) {
    const e = err as { message?: string; code?: string };
    return {
      ok: false,
      error: e.message ?? e.code ?? 'unknown Notion API error',
    };
  }
}

async function appendTo(
  notion: import('@notionhq/client').Client,
  block: NotionBlockInput,
  summary: string,
): Promise<NotionActionResult> {
  const parentId = process.env.NOTION_DEFAULT_PARENT_ID;
  if (!parentId) {
    return {
      ok: false,
      error:
        'NOTION_DEFAULT_PARENT_ID is not set. Set it to the page id you want these commands to write into.',
    };
  }
  const page = await notion.pages.retrieve({ page_id: parentId });
  const title = extractTitle(page) ?? 'Untitled';
  const url = (page as { url?: string }).url ?? '';
  await notion.blocks.children.append({
    block_id: parentId,
    // The notion SDK types are strict about block shapes but the API
    // is permissive — `as never` sidesteps the intersection checks.
    children: [block as never],
  });
  return {
    ok: true,
    kind: 'block',
    pageId: parentId,
    pageTitle: title,
    url,
    summary,
  };
}

async function createPage(
  notion: import('@notionhq/client').Client,
  parentId: string,
  title: string,
): Promise<NotionActionResult> {
  const richChildren = buildRichPageChildren(title);

  // Try as a page parent first, then as a database parent — the
  // integration may have been shared with either.
  try {
    const page = await notion.pages.create({
      parent: { page_id: parentId },
      properties: {
        title: {
          title: [{ type: 'text', text: { content: title } }],
        },
      },
      children: richChildren as never,
    });
    return {
      ok: true,
      kind: 'page',
      pageId: (page as { id: string }).id,
      title,
      url: (page as { url?: string }).url ?? '',
    };
  } catch (pageErr) {
    try {
      const page = await notion.pages.create({
        parent: { database_id: parentId },
        properties: {
          Name: {
            title: [{ type: 'text', text: { content: title } }],
          },
        },
        children: richChildren as never,
      });
      return {
        ok: true,
        kind: 'page',
        pageId: (page as { id: string }).id,
        title,
        url: (page as { url?: string }).url ?? '',
      };
    } catch {
      throw pageErr;
    }
  }
}

async function firstAvailableParent(
  notion: import('@notionhq/client').Client,
): Promise<string | null> {
  try {
    const res = await notion.search({
      page_size: 1,
      filter: { value: 'page', property: 'object' },
    });
    const first = res.results[0] as { id?: string } | undefined;
    return first?.id ?? null;
  } catch {
    return null;
  }
}

function extractTitle(obj: unknown): string | null {
  const anyObj = obj as {
    properties?: Record<string, unknown>;
  };
  const props = anyObj.properties;
  if (!props) return null;
  for (const value of Object.values(props)) {
    const v = value as { type?: string; title?: Array<{ plain_text?: string }> };
    if (v?.type === 'title' && Array.isArray(v.title)) {
      const text = v.title.map((t) => t.plain_text ?? '').join('');
      if (text.length > 0) return text;
    }
  }
  return null;
}

// ─── Block builders ────────────────────────────────────────────────────
// These deliberately return the raw Notion API shape rather than typed
// aliases so we don't have to chase SDK type changes every minor
// release. The `notion` SDK is permissive — it validates on the server.

type NotionBlockInput = Record<string, unknown>;

type RichText = Array<{ type: 'text'; text: { content: string } }>;

function rt(content: string): RichText {
  return [{ type: 'text', text: { content } }];
}

function paragraphBlock(content: string): NotionBlockInput {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: { rich_text: rt(content) },
  };
}

function headingBlock(level: 1 | 2 | 3, content: string): NotionBlockInput {
  const key = `heading_${level}` as const;
  return {
    object: 'block',
    type: key,
    [key]: { rich_text: rt(content) },
  };
}

function todoBlock(content: string, checked = false): NotionBlockInput {
  return {
    object: 'block',
    type: 'to_do',
    to_do: { rich_text: rt(content), checked },
  };
}

function bulletBlock(content: string): NotionBlockInput {
  return {
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: rt(content) },
  };
}

function calloutBlock(content: string, emoji = '💡'): NotionBlockInput {
  return {
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: rt(content),
      icon: { type: 'emoji', emoji },
    },
  };
}

function dividerBlock(): NotionBlockInput {
  return { object: 'block', type: 'divider', divider: {} };
}

function tableBlock(title: string): NotionBlockInput {
  // A 4-column × 3-row starter table: header + two data rows. The
  // first row is rendered as a header because `has_column_header` is
  // true. Values are placeholder so the user can fill them in.
  return {
    object: 'block',
    type: 'table',
    table: {
      table_width: 4,
      has_column_header: true,
      has_row_header: false,
      children: [
        {
          object: 'block',
          type: 'table_row',
          table_row: {
            cells: [rt('Item'), rt('Owner'), rt('Status'), rt('Due')],
          },
        },
        {
          object: 'block',
          type: 'table_row',
          table_row: {
            cells: [rt(title), rt('You'), rt('Not started'), rt('—')],
          },
        },
        {
          object: 'block',
          type: 'table_row',
          table_row: {
            cells: [rt('—'), rt('—'), rt('—'), rt('—')],
          },
        },
      ],
    },
  };
}

/**
 * `/notion-page` creates a real working document, not a stub. The
 * layout intentionally mirrors a Notion PRD template — callout summary,
 * three headed sections, a checklist, a starter table, and a notes
 * divider — so the user can open the page and immediately start
 * editing content instead of staring at an empty canvas.
 */
function buildRichPageChildren(title: string): NotionBlockInput[] {
  return [
    calloutBlock(
      `Generated from Node — the "${title}" space. Click anywhere to keep editing.`,
    ),
    headingBlock(2, 'Summary'),
    paragraphBlock(
      `Short description of ${title}. What are we trying to accomplish, and why now?`,
    ),
    headingBlock(2, 'Key decisions'),
    bulletBlock('Decision 1 — who, what, when'),
    bulletBlock('Decision 2 — tradeoff and rationale'),
    bulletBlock('Decision 3 — follow-up needed'),
    headingBlock(2, 'Action items'),
    todoBlock('Draft brief and share with team', false),
    todoBlock('Review in weekly planning', false),
    todoBlock('Schedule kickoff', false),
    headingBlock(2, 'Tracker'),
    tableBlock(title),
    dividerBlock(),
    headingBlock(3, 'Notes'),
    paragraphBlock('Loose notes and links go here.'),
  ];
}
