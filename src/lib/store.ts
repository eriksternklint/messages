import { promises as fs } from 'fs';
import path from 'path';
import type { NewsStory } from '@/types/news';
import { SEED_STORIES } from './seed-news';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORIES_FILE = path.join(DATA_DIR, 'stories.json');

// In-memory cache
let storiesCache: NewsStory[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readStoriesFile(): Promise<NewsStory[]> {
  try {
    const raw = await fs.readFile(STORIES_FILE, 'utf-8');
    return JSON.parse(raw) as NewsStory[];
  } catch {
    return [];
  }
}

async function writeStoriesFile(stories: NewsStory[]) {
  await ensureDataDir();
  await fs.writeFile(STORIES_FILE, JSON.stringify(stories, null, 2), 'utf-8');
}

export async function getStories(): Promise<NewsStory[]> {
  const now = Date.now();
  if (storiesCache && now - cacheTimestamp < CACHE_TTL_MS) {
    return storiesCache;
  }

  let stories = await readStoriesFile();
  if (stories.length === 0) {
    // Prime with seed data
    stories = SEED_STORIES;
    await writeStoriesFile(stories);
  }

  storiesCache = stories;
  cacheTimestamp = now;
  return stories;
}

export async function getStoryById(id: string): Promise<NewsStory | null> {
  const stories = await getStories();
  return stories.find((s) => s.id === id) ?? null;
}

export async function upsertStory(story: NewsStory) {
  await ensureDataDir();
  const stories = await readStoriesFile();
  const idx = stories.findIndex((s) => s.id === story.id);
  if (idx >= 0) {
    stories[idx] = story;
  } else {
    stories.unshift(story);
  }
  storiesCache = stories;
  cacheTimestamp = Date.now();
  await writeStoriesFile(stories);
}

export async function upsertStories(newStories: NewsStory[]) {
  await ensureDataDir();
  const existing = await readStoriesFile();
  const map = new Map(existing.map((s) => [s.id, s]));
  for (const s of newStories) {
    map.set(s.id, s);
  }
  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  storiesCache = merged;
  cacheTimestamp = Date.now();
  await writeStoriesFile(merged);
}
