import type { Message } from '@/types';

export interface DraftResult {
  draftedResponse: string;
  contextSources: string[];
  confidence: number;
  provider: 'anthropic' | 'mock';
}

/**
 * Client-side wrapper. Calls the Next.js route handler at
 * `/api/ai/draft` so no Anthropic SDK code ends up in the browser
 * bundle and no API key is ever shipped to the client.
 */
export async function generateDraft(message: Message): Promise<DraftResult> {
  const res = await fetch('/api/ai/draft', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    throw new Error(`Draft request failed: ${res.status}`);
  }
  return (await res.json()) as DraftResult;
}
