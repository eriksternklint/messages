import type { Message } from '@/types';

import { runNotionAction, type NotionActionResult } from './notion-server';

/**
 * Server-side slash-command dispatcher. Given the raw text the user
 * typed (`/notion-page Launch plan` etc.) and the channel context, it
 * runs the side-effect against the live integration and returns a
 * `Message` to be appended to the channel as the system acknowledgement.
 *
 * Wired up by `/api/commands/run`; the client-side composer dispatches
 * the user message, then POSTs to that route, then dispatches the
 * resulting ack message.
 */
export interface SlashRunResult {
  ackMessage: Message;
}

export async function runSlashCommand(
  rawText: string,
  channelId: string,
): Promise<SlashRunResult> {
  const trimmed = rawText.trim();
  const [head, ...rest] = trimmed.split(/\s+/);
  const args = rest.join(' ').trim();

  let body: string;
  let blocks: Message['blocks'];

  switch (head) {
    case '/notion-page': {
      if (!args) {
        body =
          'Usage: `/notion-page [title]` — creates a new Notion page with sections, checklist and a tracker table.';
        blocks = [{ type: 'markdown', content: body }];
        break;
      }
      const result = await runNotionAction({ kind: 'create-page', title: args });
      ({ body, blocks } = formatNotionResult(result, args));
      break;
    }
    case '/notion-table': {
      if (!args) {
        body =
          'Usage: `/notion-table [title]` — drops a 4×3 starter tracker table into the pinned Notion page.';
        blocks = [{ type: 'markdown', content: body }];
        break;
      }
      const result = await runNotionAction({ kind: 'append-table', title: args });
      ({ body, blocks } = formatNotionResult(result, args));
      break;
    }
    case '/notion-todo': {
      if (!args) {
        body =
          'Usage: `/notion-todo [text]` — appends a checkbox to-do on the pinned Notion page.';
        blocks = [{ type: 'markdown', content: body }];
        break;
      }
      const result = await runNotionAction({ kind: 'append-todo', text: args });
      ({ body, blocks } = formatNotionResult(result, args));
      break;
    }
    case '/update-block': {
      if (!args) {
        body =
          "Usage: `/update-block [text]` — appends a paragraph to the channel's pinned Notion page.";
        blocks = [{ type: 'markdown', content: body }];
        break;
      }
      const result = await runNotionAction({
        kind: 'append-paragraph',
        text: args,
      });
      ({ body, blocks } = formatNotionResult(result, args));
      break;
    }
    case '/notion-search': {
      if (!args) {
        body = 'Usage: `/notion-search [query]` — searches your Notion workspace.';
        blocks = [{ type: 'markdown', content: body }];
        break;
      }
      const result = await runNotionAction({ kind: 'search', query: args });
      ({ body, blocks } = formatNotionResult(result, args));
      break;
    }
    default: {
      body = `Unknown command \`${head}\`. Try /notion-page, /notion-table, /notion-todo, /update-block, or /notion-search.`;
      blocks = [{ type: 'markdown', content: body }];
    }
  }

  const ackMessage: Message = {
    id: `cmd:${Date.now()}`,
    source: 'system',
    channelId,
    author: { id: 'system', name: 'Node', kind: 'system' },
    createdAt: new Date().toISOString(),
    blocks,
    rawText: body,
  };

  return { ackMessage };
}

function formatNotionResult(
  result: NotionActionResult,
  arg: string,
): { body: string; blocks: Message['blocks'] } {
  if (!result.ok) {
    const body = `Notion call failed: ${result.error}`;
    return { body, blocks: [{ type: 'markdown', content: `⚠ ${body}` }] };
  }
  if (result.kind === 'page') {
    const body = `Created Notion page “${result.title}” with a full template.`;
    return {
      body,
      blocks: [
        { type: 'markdown', content: `✓ ${body}` },
        {
          type: 'notion-page-ref',
          pageId: result.pageId,
          title: result.title,
          url: result.url,
        },
      ],
    };
  }
  if (result.kind === 'block') {
    const body = `${result.summary} on “${result.pageTitle}”.`;
    return {
      body,
      blocks: [
        { type: 'markdown', content: `✓ ${body}` },
        {
          type: 'notion-page-ref',
          pageId: result.pageId,
          title: result.pageTitle,
          url: result.url,
        },
      ],
    };
  }
  // search
  if (result.results.length === 0) {
    const body = `No Notion pages found for “${arg}”.`;
    return { body, blocks: [{ type: 'markdown', content: body }] };
  }
  const lines = result.results
    .slice(0, 5)
    .map((r) => `- [${r.title}](${r.url})`)
    .join('\n');
  const body = `Found ${result.results.length} results for “${arg}”:\n${lines}`;
  return {
    body,
    blocks: [{ type: 'markdown', content: body }],
  };
}
