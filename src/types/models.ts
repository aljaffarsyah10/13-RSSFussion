export type SubscriptionPlan = "free" | "starter" | "pro" | "business";

export type SourceStatus = "healthy" | "pending" | "error" | "disabled";

export interface FeedFetchLog {
  id: string;
  source_id: string;
  status: "success" | "failed" | "not_modified";
  http_status?: number | null;
  articles_found: number;
  articles_inserted: number;
  error_message?: string | null;
  duration_ms: number;
  created_at: string;
}

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
  fetchLogs?: FeedFetchLog[];
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

export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing";
export type BillingCycle = "monthly" | "annual";

export interface SubscriptionRecord {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BillingInvoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  status: "paid" | "pending" | "failed" | "refunded";
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  paidAt?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  plan: SubscriptionPlan;
  organizationName?: string;
  role: "owner" | "admin" | "member";
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface OnboardingState {
  completed: boolean;
  suggestedTopics: Array<{
    id: string;
    name: string;
    description: string;
    defaultKeywords: string[];
    suggestedFeeds: Array<{ name: string; url: string; siteUrl: string }>;
  }>;
}
