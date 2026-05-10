import type { RawArticle, PoliticalLean } from '@/types/news';
import { NEWS_SOURCES, SOURCE_MAP } from './sources';

// Lightweight RSS/Atom parser using fetch + regex. No external deps.

function extractText(xml: string, tag: string): string {
  // Try CDATA first, then plain text
  const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
  const plainRe = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const cdata = cdataRe.exec(xml);
  if (cdata) return cdata[1].trim();
  const plain = plainRe.exec(xml);
  if (plain) return plain[1].replace(/<[^>]+>/g, '').trim();
  return '';
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]+${attr}=["']([^"']+)["']`, 'i');
  const m = re.exec(xml);
  return m ? m[1].trim() : '';
}

function extractImage(itemXml: string): string | undefined {
  // Try media:content, media:thumbnail, enclosure, og:image patterns
  const patterns = [
    /media:content[^>]+url=["']([^"']+\.(jpg|jpeg|png|webp)[^"']*)["']/i,
    /media:thumbnail[^>]+url=["']([^"']+)["']/i,
    /enclosure[^>]+url=["']([^"']+\.(jpg|jpeg|png|webp)[^"']*)["']/i,
    /<img[^>]+src=["']([^"']+)["']/i,
  ];
  for (const re of patterns) {
    const m = re.exec(itemXml);
    if (m) return m[1];
  }
  return undefined;
}

function parseItems(feedXml: string): Array<{ title: string; description: string; link: string; pubDate: string; imageUrl?: string }> {
  // Handle both RSS <item> and Atom <entry>
  const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  const entryRe = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
  const results: Array<{ title: string; description: string; link: string; pubDate: string; imageUrl?: string }> = [];

  let match: RegExpExecArray | null;

  while ((match = itemRe.exec(feedXml)) !== null) {
    const chunk = match[1];
    const link = extractText(chunk, 'link') || extractAttr(chunk, 'link', 'href');
    results.push({
      title: extractText(chunk, 'title'),
      description: extractText(chunk, 'description') || extractText(chunk, 'summary'),
      link,
      pubDate: extractText(chunk, 'pubDate') || extractText(chunk, 'published') || extractText(chunk, 'updated'),
      imageUrl: extractImage(chunk),
    });
  }

  // If no RSS items found, try Atom entries
  if (results.length === 0) {
    while ((match = entryRe.exec(feedXml)) !== null) {
      const chunk = match[1];
      const link = extractAttr(chunk, 'link', 'href') || extractText(chunk, 'link');
      results.push({
        title: extractText(chunk, 'title'),
        description: extractText(chunk, 'summary') || extractText(chunk, 'content'),
        link,
        pubDate: extractText(chunk, 'published') || extractText(chunk, 'updated'),
        imageUrl: extractImage(chunk),
      });
    }
  }

  return results.filter((i) => i.title && i.link);
}

async function fetchFeed(url: string, timeoutMs = 10_000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Prism-News-Bot/1.0 (+https://prism.news)',
        Accept: 'application/rss+xml, application/atom+xml, text/xml, */*',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function generateId(url: string): string {
  // Simple deterministic hash-like ID from URL
  let h = 5381;
  for (let i = 0; i < url.length; i++) {
    h = (h * 33) ^ url.charCodeAt(i);
  }
  return `raw-${(h >>> 0).toString(36)}`;
}

export async function fetchSourceArticles(sourceId: string): Promise<RawArticle[]> {
  const source = SOURCE_MAP.get(sourceId);
  if (!source) return [];

  let xml: string;
  try {
    xml = await fetchFeed(source.rssUrl);
  } catch (err) {
    console.warn(`[RSS] Failed to fetch ${source.name}: ${err}`);
    return [];
  }

  const items = parseItems(xml);
  return items.slice(0, 15).map((item) => ({
    id: generateId(item.link),
    title: item.title,
    description: item.description.slice(0, 500),
    url: item.link,
    imageUrl: item.imageUrl,
    publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    sourceId: source.id,
    sourceName: source.name,
    sourceLean: source.lean,
  }));
}

export async function fetchAllSources(): Promise<RawArticle[]> {
  const results = await Promise.allSettled(
    NEWS_SOURCES.map((s) => fetchSourceArticles(s.id))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<RawArticle[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);
}

// Group articles by topic using title keyword overlap
export function clusterArticles(articles: RawArticle[]): RawArticle[][] {
  const clusters: RawArticle[][] = [];
  const used = new Set<string>();

  function keywords(title: string): Set<string> {
    const stop = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but', 'with', 'from', 'by', 'as', 'is', 'are', 'was', 'were', 'be', 'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'its', 'their', 'this', 'that']);
    return new Set(
      title
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .split(' ')
        .filter((w) => w.length > 3 && !stop.has(w))
    );
  }

  function similarity(a: string, b: string): number {
    const ka = keywords(a);
    const kb = keywords(b);
    let common = 0;
    for (const w of ka) if (kb.has(w)) common++;
    return common / Math.max(ka.size, kb.size, 1);
  }

  for (const article of articles) {
    if (used.has(article.id)) continue;
    const cluster = [article];
    used.add(article.id);

    for (const other of articles) {
      if (used.has(other.id)) continue;
      if (similarity(article.title, other.title) >= 0.25) {
        cluster.push(other);
        used.add(other.id);
      }
    }

    clusters.push(cluster);
  }

  // Only return clusters with 2+ sources (or at least 1 for unique stories)
  return clusters.sort((a, b) => b.length - a.length);
}

export function avgBiasScore(articles: RawArticle[]): number {
  const leanToScore: Record<PoliticalLean, number> = {
    'far-left': -2,
    'left': -1,
    'center': 0,
    'right': 1,
    'far-right': 2,
  };
  if (articles.length === 0) return 0;
  const sum = articles.reduce((acc, a) => acc + leanToScore[a.sourceLean], 0);
  return Math.round((sum / articles.length) * 10) / 10;
}

export function hasBiasContrast(articles: RawArticle[]): boolean {
  const leans = new Set(articles.map((a) => a.sourceLean));
  const hasLeft = leans.has('left') || leans.has('far-left');
  const hasRight = leans.has('right') || leans.has('far-right');
  return hasLeft && hasRight;
}
