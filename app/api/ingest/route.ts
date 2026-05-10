import { NextResponse } from 'next/server';
import { fetchAllSources, clusterArticles } from '@/lib/rss';
import { processClusters } from '@/lib/news-pipeline';
import { upsertStories } from '@/lib/store';

// POST /api/ingest — fetch all RSS feeds, cluster articles, run AI pipeline
// Requires ANTHROPIC_API_KEY to be set
export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured. Add it to .env.local to enable live ingestion.' },
      { status: 503 }
    );
  }

  const body = req.body ? await req.json().catch(() => ({})) : {};
  const maxStories: number = (body as { maxStories?: number }).maxStories ?? 20;

  try {
    console.log('[Ingest] Fetching RSS feeds...');
    const allArticles = await fetchAllSources();
    console.log(`[Ingest] Fetched ${allArticles.length} articles`);

    const clusters = clusterArticles(allArticles);
    console.log(`[Ingest] Formed ${clusters.length} topic clusters`);

    const stories = await processClusters(clusters, maxStories);
    console.log(`[Ingest] Generated ${stories.length} stories`);

    await upsertStories(stories);

    return NextResponse.json({
      ok: true,
      articlesIngested: allArticles.length,
      clustersFormed: clusters.length,
      storiesCreated: stories.length,
    });
  } catch (err) {
    console.error('[Ingest] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
