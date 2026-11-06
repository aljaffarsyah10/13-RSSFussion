export type SubscriptionPlan = "free" | "starter" | "pro" | "business";

export type SourceStatus = "healthy" | "pending" | "error" | "disabled";

export interface RssSource {
  id: string;
  userId: string;
  name: string;
  feedUrl: string;
  siteUrl: string;
  description?: string;
  enabled: boolean;
  status: SourceStatus;
  lastFetchedAt?: string;
  lastSuccessAt?: string;
  nextFetchAt?: string;
  fetchIntervalMinutes: number;
  consecutiveFailures: number;
  lastError?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Article {
  id: string;
  sourceId: string;
  sourceName: string;
  guid?: string;
  canonicalUrl: string;
  originalUrl: string;
  title: string;
  description: string;
  contentSnippet?: string;
  author?: string;
  imageUrl?: string;
  publishedAt: string;
  fetchedAt: string;
  createdAt: string;
  isSaved?: boolean;
  isRead?: boolean;
  matchedKeywords?: string[];
  topics?: string[];
}

export interface Topic {
  id: string;
  userId: string;
  name: string;
  description?: string;
  keywordsCount?: number;
  articlesCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Keyword {
  id: string;
  userId: string;
  topicId?: string;
  topicName?: string;
  keyword: string;
  enabled: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalSources: number;
  activeSources: number;
  totalArticlesToday: number;
  totalTopics: number;
  totalSavedArticles: number;
}
