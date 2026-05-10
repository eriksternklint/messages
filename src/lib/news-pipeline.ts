import type { RawArticle, NewsStory, Category } from '@/types/news';
import { avgBiasScore, hasBiasContrast as checkBiasContrast } from './rss';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { content: Array<{ text: string }> };
  return data.content[0]?.text ?? '';
}

async function callClaudeJSON<T>(systemPrompt: string, userMessage: string): Promise<T> {
  const raw = await callClaude(systemPrompt, userMessage);
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  return JSON.parse(cleaned) as T;
}

const SYSTEM_JOURNALIST = `You are a senior news editor at a respected nonpartisan news organization.
Your job is to synthesize multiple news articles on the same topic into a single, balanced, factual summary.
You present facts without ideological framing, acknowledge uncertainty where it exists, and explain complex topics clearly.
You never editorialize or take political sides. Respond only with valid JSON.`;

interface StoryAnalysis {
  headline: string;
  summary: string;
  whatItMeans: string;
  rightPerspective?: string;
  leftPerspective?: string;
  category: Category;
  tags: string[];
  imageUrl: string;
}

export async function analyzeCluster(articles: RawArticle[]): Promise<StoryAnalysis> {
  const contrast = checkBiasContrast(articles);

  const articlesText = articles
    .map(
      (a, i) =>
        `[Article ${i + 1}] Source: ${a.sourceName} (${a.sourceLean})\nTitle: ${a.title}\nDescription: ${a.description}`
    )
    .join('\n\n');

  const prompt = `Analyze these ${articles.length} news articles about the same topic and produce a balanced news story.

${articlesText}

Return a JSON object with exactly these fields:
{
  "headline": "A neutral, factual headline under 15 words",
  "summary": "3 paragraphs of balanced reporting (300-400 words total). Paragraph 1: what happened. Paragraph 2: key details and context. Paragraph 3: implications and what comes next.",
  "whatItMeans": "A plain-English explanation (150-200 words) explaining why this matters to an ordinary person — no jargon, no political framing.",
  ${contrast ? '"rightPerspective": "What conservative and right-leaning sources emphasize or argue (2-3 sentences). Be accurate and fair.",\n  "leftPerspective": "What progressive and left-leaning sources emphasize or argue (2-3 sentences). Be accurate and fair.",' : ''}
  "category": "One of: politics|world|business|technology|science|health|sports|entertainment|environment|crime|culture|other",
  "tags": ["3 to 6 short topic tags"],
  "imageUrl": "https://picsum.photos/seed/${encodeURIComponent(articles[0]?.title?.slice(0, 20) ?? 'news')}/1200/800"
}`;

  return callClaudeJSON<StoryAnalysis>(SYSTEM_JOURNALIST, prompt);
}

function generateId(title: string, date: string): string {
  const str = `${title}-${date}`;
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return `story-${(h >>> 0).toString(36)}`;
}

export async function processCluster(articles: RawArticle[]): Promise<NewsStory> {
  const analysis = await analyzeCluster(articles);
  const publishedAt =
    articles.reduce((latest, a) =>
      new Date(a.publishedAt) > new Date(latest.publishedAt) ? a : latest
    ).publishedAt;

  const id = generateId(analysis.headline, publishedAt);

  return {
    id,
    headline: analysis.headline,
    summary: analysis.summary,
    whatItMeans: analysis.whatItMeans,
    rightPerspective: analysis.rightPerspective,
    leftPerspective: analysis.leftPerspective,
    category: analysis.category,
    imageUrl: analysis.imageUrl,
    tags: analysis.tags,
    sources: articles,
    biasScore: avgBiasScore(articles),
    hasBiasContrast: checkBiasContrast(articles),
    publishedAt,
    createdAt: new Date().toISOString(),
  };
}

export async function processClusters(
  clusters: RawArticle[][],
  maxStories = 30
): Promise<NewsStory[]> {
  const stories: NewsStory[] = [];
  const toProcess = clusters.slice(0, maxStories);

  // Process in batches of 5 to avoid rate limits
  const BATCH = 5;
  for (let i = 0; i < toProcess.length; i += BATCH) {
    const batch = toProcess.slice(i, i + BATCH);
    const results = await Promise.allSettled(batch.map((c) => processCluster(c)));
    for (const r of results) {
      if (r.status === 'fulfilled') stories.push(r.value);
      else console.warn('[AI] Failed to process cluster:', r.reason);
    }
  }

  return stories;
}
