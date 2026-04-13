/**
 * Server-side Notion adapter for slash commands.
 *
 * Lazily imports `@notionhq/client` so the `notion` SDK only ends up
 * in the server bundle when the route handler that depends on it
 * gets built. Reads `NOTION_API_KEY` from env on every call — there's
 * no caching layer because slash commands are infrequent.
 *
 * Three primitives:
 *  - create-page         → POST a new page under NOTION_DEFAULT_PARENT_ID
 *  - append-paragraph    → append a paragraph block to that same page
 *  - search              → call the Notion search API and return hits
 *
 * If the key (or parent id, where required) is missing the call
 * fails with a structured `{ ok: false, error }` rather than throwing,
 * so the route can return a clean ack message.
 */

export type NotionAction =
  | { kind: 'create-page'; title: string }
  | { kind: 'append-paragraph'; text: string }
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
        // Fall back to the first page the integration can see, so
        // brand new connections "just work" without env wiring.
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
      const parentId = process.env.NOTION_DEFAULT_PARENT_ID;
      if (!parentId) {
        return {
          ok: false,
          error:
            'NOTION_DEFAULT_PARENT_ID is not set. Set it to the page id you want /update-block to write into.',
        };
      }
      const page = await notion.pages.retrieve({ page_id: parentId });
      const title = extractTitle(page) ?? 'Untitled';
      const url = (page as { url?: string }).url ?? '';
      await notion.blocks.children.append({
        block_id: parentId,
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: action.text } }],
            },
          },
        ],
      });
      return {
        ok: true,
        kind: 'block',
        pageId: parentId,
        pageTitle: title,
        url,
      };
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

async function createPage(
  notion: import('@notionhq/client').Client,
  parentId: string,
  title: string,
): Promise<NotionActionResult> {
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
      });
      return {
        ok: true,
        kind: 'page',
        pageId: (page as { id: string }).id,
        title,
        url: (page as { url?: string }).url ?? '',
      };
    } catch {
      // Re-throw the original page-parent error since that's the
      // common case and gives the most useful diagnostic.
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
