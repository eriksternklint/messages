import { NextResponse } from 'next/server';
import { getStories } from '@/lib/store';
import { buildPersonalizedFeed, buildUserProfile } from '@/lib/personalization';
import type { Interaction } from '@/types/news';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { interactions?: Interaction[]; limit?: number };
    const interactions = body.interactions ?? [];
    const limit = body.limit ?? 20;

    const stories = await getStories();
    const profile = buildUserProfile(interactions);
    const feed = buildPersonalizedFeed(stories, profile, limit);

    return NextResponse.json({ stories: feed, total: stories.length });
  } catch (err) {
    console.error('[API/feed]', err);
    return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 });
  }
}

// Also support GET for simple unauthenticated feed
export async function GET() {
  try {
    const stories = await getStories();
    return NextResponse.json({ stories: stories.slice(0, 20), total: stories.length });
  } catch (err) {
    console.error('[API/feed GET]', err);
    return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 });
  }
}
