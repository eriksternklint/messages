import { NextResponse } from 'next/server';
import { getStoryById } from '@/lib/store';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const story = await getStoryById(params.id);
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }
    return NextResponse.json(story);
  } catch (err) {
    console.error('[API/article]', err);
    return NextResponse.json({ error: 'Failed to load article' }, { status: 500 });
  }
}
