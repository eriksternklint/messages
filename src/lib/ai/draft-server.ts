import type { Message } from '@/types';

import { vectorSearch, type KnowledgeDoc } from './context';

export interface DraftResult {
  draftedResponse: string;
  contextSources: string[];
  confidence: number;
  provider: 'anthropic' | 'mock';
}

/**
 * Server-side draft engine. This file imports `@anthropic-ai/sdk`
 * lazily so it only ends up in the server bundle when the route
 * handler that imports it is built.
 *
 * If ANTHROPIC_API_KEY is set, we call Claude Sonnet 4.6 with the
 * matched RAG context as the user message and a cached system
 * prompt. Otherwise we fall back to a deterministic mock that still
 * references the retrieved context so the UI experience is identical.
 */
export async function generateDraftServer(message: Message): Promise<DraftResult> {
  const context = vectorSearch(message.rawText);
  const contextSources = context.map((d) => d.id);

  const key = process.env.ANTHROPIC_API_KEY;
  if (key) {
    try {
      const response = await callClaude(message, context, key);
      return {
        draftedResponse: response,
        contextSources,
        confidence: 0.86,
        provider: 'anthropic',
      };
    } catch (err) {
      console.error('[ai/draft] Anthropic call failed, falling back to mock:', err);
    }
  }

  return {
    draftedResponse: mockDraft(message, context),
    contextSources,
    confidence: 0.72,
    provider: 'mock',
  };
}

const SYSTEM_PROMPT = `You are Node, an AI assistant inside a conversational operating system.
Your job is to draft a concise reply (1–2 sentences, plain text, no markdown, no greeting) to the incoming message shown below.
Use the provided CONTEXT blocks to ground your response in specifics — names, dates, numbers — rather than generic acknowledgements.
If the message asks a yes/no question you already know the answer to from context, answer directly.
Never invent facts that contradict the context.`;

async function callClaude(
  message: Message,
  context: KnowledgeDoc[],
  apiKey: string,
): Promise<string> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

  const contextBlock =
    context.length > 0
      ? context
          .map((d) => `[${d.id}] ${d.title}\n${d.content}`)
          .join('\n\n')
      : '(no relevant context found)';

  const userText = [
    `MESSAGE FROM ${message.author.name} (via ${message.source}):`,
    message.rawText,
    '',
    'CONTEXT:',
    contextBlock,
  ].join('\n');

  const response = await client.messages.create({
    model,
    max_tokens: 200,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userText }],
  });

  return response.content
    .filter((block) => block.type === 'text')
    .map((block) => ('text' in block ? block.text : ''))
    .join('')
    .trim();
}

/**
 * Deterministic fallback draft. Matches the question/deadline shape
 * of the incoming message and references the top-scoring context
 * document so the reply feels grounded.
 */
function mockDraft(message: Message, context: KnowledgeDoc[]): string {
  const text = message.rawText;
  const topRef = context[0];
  const refPhrase = topRef ? ` I'll reference ${topRef.title}.` : '';

  const hasQuestion = /\?/.test(text);
  const hasUrgent = /\b(eod|today|tonight|tomorrow|friday|asap|urgent)\b/i.test(text);

  if (hasQuestion && hasUrgent) {
    return `Yes — on it now and will confirm back within the hour.${refPhrase}`;
  }
  if (hasQuestion) {
    return `Good question.${refPhrase} Replying with specifics shortly.`;
  }
  if (hasUrgent) {
    return `Got it — prioritizing now.${refPhrase}`;
  }
  return `Thanks — noted and added to the task queue.${refPhrase}`;
}
