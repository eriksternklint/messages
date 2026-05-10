import { NextResponse } from 'next/server';
import type { Interaction } from '@/types/news';

// Interactions are stored client-side in localStorage.
// This endpoint exists for server-side analytics aggregation (future use).
export async function POST(req: Request) {
  try {
    const interaction = (await req.json()) as Interaction;
    if (!interaction.storyId || !interaction.type) {
      return NextResponse.json({ error: 'Invalid interaction' }, { status: 400 });
    }
    // Future: persist to analytics store
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
}
