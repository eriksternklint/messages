import type { NewsSource } from '@/types/news';

export const NEWS_SOURCES: NewsSource[] = [
  // Far Left
  {
    id: 'jacobin',
    name: 'Jacobin',
    lean: 'far-left',
    country: 'US',
    rssUrl: 'https://jacobin.com/feed/',
    websiteUrl: 'https://jacobin.com',
  },
  {
    id: 'democracy-now',
    name: 'Democracy Now',
    lean: 'far-left',
    country: 'US',
    rssUrl: 'https://www.democracynow.org/democracynow.rss',
    websiteUrl: 'https://www.democracynow.org',
  },

  // Left
  {
    id: 'guardian',
    name: 'The Guardian',
    lean: 'left',
    country: 'UK',
    rssUrl: 'https://www.theguardian.com/world/rss',
    websiteUrl: 'https://www.theguardian.com',
  },
  {
    id: 'msnbc',
    name: 'MSNBC',
    lean: 'left',
    country: 'US',
    rssUrl: 'https://www.msnbc.com/feeds/latest',
    websiteUrl: 'https://www.msnbc.com',
  },
  {
    id: 'npr',
    name: 'NPR',
    lean: 'left',
    country: 'US',
    rssUrl: 'https://feeds.npr.org/1001/rss.xml',
    websiteUrl: 'https://www.npr.org',
  },
  {
    id: 'huffpost',
    name: 'HuffPost',
    lean: 'left',
    country: 'US',
    rssUrl: 'https://www.huffpost.com/section/front-page/feed',
    websiteUrl: 'https://www.huffpost.com',
  },

  // Center
  {
    id: 'reuters',
    name: 'Reuters',
    lean: 'center',
    country: 'UK',
    rssUrl: 'https://feeds.reuters.com/reuters/topNews',
    websiteUrl: 'https://www.reuters.com',
  },
  {
    id: 'ap',
    name: 'AP News',
    lean: 'center',
    country: 'US',
    rssUrl: 'https://rsshub.app/apnews/topics/apf-topnews',
    websiteUrl: 'https://apnews.com',
  },
  {
    id: 'bbc',
    name: 'BBC News',
    lean: 'center',
    country: 'UK',
    rssUrl: 'https://feeds.bbci.co.uk/news/rss.xml',
    websiteUrl: 'https://www.bbc.com/news',
  },
  {
    id: 'axios',
    name: 'Axios',
    lean: 'center',
    country: 'US',
    rssUrl: 'https://api.axios.com/feed/',
    websiteUrl: 'https://www.axios.com',
  },

  // Right
  {
    id: 'foxnews',
    name: 'Fox News',
    lean: 'right',
    country: 'US',
    rssUrl: 'https://moxie.foxnews.com/google-publisher/latest.xml',
    websiteUrl: 'https://www.foxnews.com',
  },
  {
    id: 'wsj',
    name: 'Wall Street Journal',
    lean: 'right',
    country: 'US',
    rssUrl: 'https://feeds.a.dj.com/rss/WSJcomUSEdition.xml',
    websiteUrl: 'https://www.wsj.com',
  },
  {
    id: 'national-review',
    name: 'National Review',
    lean: 'right',
    country: 'US',
    rssUrl: 'https://www.nationalreview.com/feed/',
    websiteUrl: 'https://www.nationalreview.com',
  },

  // Far Right
  {
    id: 'breitbart',
    name: 'Breitbart',
    lean: 'far-right',
    country: 'US',
    rssUrl: 'https://feeds.feedburner.com/breitbart',
    websiteUrl: 'https://www.breitbart.com',
  },
  {
    id: 'daily-wire',
    name: 'Daily Wire',
    lean: 'far-right',
    country: 'US',
    rssUrl: 'https://www.dailywire.com/feeds/rss.xml',
    websiteUrl: 'https://www.dailywire.com',
  },
];

export const SOURCE_MAP = new Map(NEWS_SOURCES.map((s) => [s.id, s]));
