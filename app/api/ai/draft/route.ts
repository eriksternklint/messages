import { NextResponse } from 'next/server';

import { generateDraftServer } from '@/lib/ai/draft-server';

// Route handler for the Pre-Filled Response Engine. Accepts a
// normalized `Message` in the body and returns a `DraftResult`:
// drafted text, the context sources it used, a confidence score,
// and whether the draft came from real Claude or the mock fallback.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body?.message;
    if (!message?.rawText) {
      return NextResponse.json(
        { error: 'message with rawText is required' },
        { status: 400 },
      );
    }
    const result = await generateDraftServer(message);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/ai/draft] error', err);
    return NextResponse.json({ error: 'draft failed' }, { status: 500 });
  }
}
