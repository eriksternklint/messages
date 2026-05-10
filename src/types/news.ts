export type PoliticalLean = 'far-left' | 'left' | 'center' | 'right' | 'far-right';

export type Category =
  | 'politics'
  | 'world'
  | 'business'
  | 'technology'
  | 'science'
  | 'health'
  | 'sports'
  | 'entertainment'
  | 'environment'
  | 'crime'
  | 'culture'
  | 'other';

export interface NewsSource {
  id: string;
  name: string;
  lean: PoliticalLean;
  country: string;
  rssUrl: string;
  websiteUrl: string;
}

export interface RawArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  sourceId: string;
  sourceName: string;
  sourceLean: PoliticalLean;
}

export interface NewsStory {
  id: string;
  headline: string;
  summary: string;
  whatItMeans: string;
  rightPerspective?: string;
  leftPerspective?: string;
  category: Category;
  imageUrl: string;
  tags: string[];
  sources: RawArticle[];
  biasScore: number; // -2 (far-left) to +2 (far-right)
  hasBiasContrast: boolean;
  publishedAt: string;
  createdAt: string;
}

export interface Interaction {
  id: string;
  storyId: string;
  type: 'view' | 'read' | 'like' | 'share';
  category: Category;
  biasScore: number;
  watchTime: number; // seconds on feed card
  timestamp: string;
}

export interface UserProfile {
  interactions: Interaction[];
  categoryScores: Partial<Record<Category, number>>;
  biasExposure: Partial<Record<PoliticalLean, number>>;
  totalReadTime: number;
  storiesViewed: number;
  storiesRead: number;
  likedStories: string[];
}

export const LEAN_ORDER: PoliticalLean[] = ['far-left', 'left', 'center', 'right', 'far-right'];

export const LEAN_SCORE: Record<PoliticalLean, number> = {
  'far-left': -2,
  'left': -1,
  'center': 0,
  'right': 1,
  'far-right': 2,
};

export const LEAN_LABEL: Record<PoliticalLean, string> = {
  'far-left': 'Far Left',
  'left': 'Left',
  'center': 'Center',
  'right': 'Right',
  'far-right': 'Far Right',
};

export const LEAN_COLOR: Record<PoliticalLean, string> = {
  'far-left': '#a855f7',
  'left': '#3b82f6',
  'center': '#22c55e',
  'right': '#ef4444',
  'far-right': '#7f1d1d',
};

export const LEAN_BG: Record<PoliticalLean, string> = {
  'far-left': 'bg-purple-600',
  'left': 'bg-blue-500',
  'center': 'bg-green-500',
  'right': 'bg-red-500',
  'far-right': 'bg-red-900',
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  politics: '🏛️',
  world: '🌍',
  business: '💼',
  technology: '💻',
  science: '🔬',
  health: '🏥',
  sports: '⚽',
  entertainment: '🎬',
  environment: '🌿',
  crime: '🔒',
  culture: '🎭',
  other: '📰',
};
