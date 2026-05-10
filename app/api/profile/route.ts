import { NextResponse } from 'next/server';
import { getStories } from '@/lib/store';
import {
  buildUserProfile,
  computeUserBias,
  upToDateScore,
  topCategories,
} from '@/lib/personalization';
import type { Interaction } from '@/types/news';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { interactions?: Interaction[] };
    const interactions = body.interactions ?? [];

    const stories = await getStories();
    const profile = buildUserProfile(interactions);
    const biasScore = computeUserBias(profile);
    const upToDate = upToDateScore(stories, profile);
    const categories = topCategories(profile);

    function biasLabel(score: number): string {
      if (score <= -1.5) return 'Far Left';
      if (score <= -0.5) return 'Left-Leaning';
      if (score <= 0.5) return 'Balanced';
      if (score <= 1.5) return 'Right-Leaning';
      return 'Far Right';
    }

    return NextResponse.json({
      biasScore,
      biasLabel: biasLabel(biasScore),
      upToDatePct: upToDate,
      topCategories: categories,
      storiesViewed: profile.storiesViewed,
      storiesRead: profile.storiesRead,
      totalReadTime: profile.totalReadTime,
      likedStories: profile.likedStories,
    });
  } catch (err) {
    console.error('[API/profile]', err);
    return NextResponse.json({ error: 'Failed to compute profile' }, { status: 500 });
  }
}
