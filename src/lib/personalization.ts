import type { NewsStory, Interaction, UserProfile, Category } from '@/types/news';

// Interaction weights for scoring
const WEIGHT = {
  share: 5,
  like: 3,
  read: 2,
  view: 1,
} as const;

const WATCH_TIME_WEIGHT = 0.05; // per second

export function buildUserProfile(interactions: Interaction[]): UserProfile {
  const categoryScores: Partial<Record<Category, number>> = {};
  const biasExposure: Partial<Record<string, number>> = {};
  let totalReadTime = 0;
  let storiesViewed = 0;
  let storiesRead = 0;
  const likedStories: string[] = [];
  const seenStories = new Set<string>();

  for (const ix of interactions) {
    const weight = WEIGHT[ix.type] + ix.watchTime * WATCH_TIME_WEIGHT;
    categoryScores[ix.category] = (categoryScores[ix.category] ?? 0) + weight;
    totalReadTime += ix.watchTime;

    if (!seenStories.has(ix.storyId)) {
      storiesViewed++;
      seenStories.add(ix.storyId);
    }
    if (ix.type === 'read') storiesRead++;
    if (ix.type === 'like') likedStories.push(ix.storyId);

    // Track which lean scores the user has been exposed to (for profile display)
    const leanKey = biasToLean(ix.biasScore);
    biasExposure[leanKey] = (biasExposure[leanKey] ?? 0) + weight;
  }

  return {
    interactions,
    categoryScores,
    biasExposure,
    totalReadTime,
    storiesViewed,
    storiesRead,
    likedStories,
  };
}

function biasToLean(score: number): string {
  if (score <= -1.5) return 'far-left';
  if (score <= -0.5) return 'left';
  if (score <= 0.5) return 'center';
  if (score <= 1.5) return 'right';
  return 'far-right';
}

// Compute a weighted average bias score from interactions
export function computeUserBias(profile: UserProfile): number {
  const { interactions } = profile;
  if (interactions.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;
  for (const ix of interactions) {
    const w = WEIGHT[ix.type] + ix.watchTime * WATCH_TIME_WEIGHT;
    weightedSum += ix.biasScore * w;
    totalWeight += w;
  }
  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
}

export function scoreStoryForUser(
  story: NewsStory,
  profile: UserProfile,
  seenStoryIds: Set<string>
): number {
  if (seenStoryIds.has(story.id)) return -1; // don't resurface seen stories

  const now = Date.now();
  const ageMs = now - new Date(story.publishedAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  // Recency score: decays over 48 hours
  const recencyScore = Math.max(0, 1 - ageHours / 48);

  // Category affinity score (normalized 0-1)
  const scores = Object.values(profile.categoryScores);
  const maxScore = scores.length > 0 ? Math.max(...scores) : 1;
  const categoryScore = maxScore > 0 ? (profile.categoryScores[story.category] ?? 0) / maxScore : 0;

  // Diversity bonus: categories with 0 interactions get a bump to avoid filter bubbles
  const diversityBonus = !profile.categoryScores[story.category] ? 0.15 : 0;

  // Source diversity: don't over-represent any one source
  // (handled at feed construction level, not here)

  // Final score: 40% category affinity, 40% recency, 20% diversity
  return categoryScore * 0.4 + recencyScore * 0.4 + diversityBonus * 0.2 + Math.random() * 0.05;
}

export function buildPersonalizedFeed(
  stories: NewsStory[],
  profile: UserProfile,
  limit = 20
): NewsStory[] {
  const seenIds = new Set(profile.interactions.map((i) => i.storyId));

  const scored = stories
    .map((s) => ({ story: s, score: scoreStoryForUser(s, profile, seenIds) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score);

  // Enforce source diversity: max 2 stories from same source in top 10
  const sourceCount = new Map<string, number>();
  const result: NewsStory[] = [];

  for (const { story } of scored) {
    if (result.length >= limit) break;

    // Use first source's id for diversity check
    const primarySource = story.sources[0]?.sourceId ?? 'unknown';
    const count = sourceCount.get(primarySource) ?? 0;
    if (count >= 2 && result.length < 10) continue;

    sourceCount.set(primarySource, count + 1);
    result.push(story);
  }

  return result;
}

// "How up to date" score: % of today's stories the user has seen
export function upToDateScore(stories: NewsStory[], profile: UserProfile): number {
  const now = Date.now();
  const todayStories = stories.filter(
    (s) => now - new Date(s.publishedAt).getTime() < 24 * 60 * 60 * 1000
  );
  if (todayStories.length === 0) return 100;
  const seenIds = new Set(profile.interactions.map((i) => i.storyId));
  const seenToday = todayStories.filter((s) => seenIds.has(s.id)).length;
  return Math.round((seenToday / todayStories.length) * 100);
}

export function topCategories(
  profile: UserProfile
): Array<{ category: Category; score: number; pct: number }> {
  const entries = Object.entries(profile.categoryScores) as Array<[Category, number]>;
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (total === 0) return [];
  return entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([category, score]) => ({
      category,
      score,
      pct: Math.round((score / total) * 100),
    }));
}
