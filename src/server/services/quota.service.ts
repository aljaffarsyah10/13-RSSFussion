import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cache } from "@/lib/cache/cache-manager";

export interface QuotaConfig {
  maxSources: number;
  maxKeywords: number;
  maxTopics: number;
}

export const PLAN_LIMITS: Record<string, QuotaConfig> = {
  free: { maxSources: 5, maxKeywords: 3, maxTopics: 3 },
  starter: { maxSources: 30, maxKeywords: 20, maxTopics: 20 },
  pro: { maxSources: 100, maxKeywords: 100, maxTopics: 100 },
  business: { maxSources: 999999, maxKeywords: 999999, maxTopics: 999999 },
};

export async function getUserPlan(userId: string): Promise<string> {
  const cacheKey = `user_plan:${userId}`;

  return cache.remember(cacheKey, 120, async () => {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    return data?.plan || "free";
  });
}

export async function invalidateUserPlanCache(userId: string) {
  await cache.del(`user_plan:${userId}`);
}

export async function checkSourceQuota(userId: string): Promise<void> {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  const supabase = await createServerSupabaseClient();
  const { count, error } = await supabase
    .from("rss_sources")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (!error && (count || 0) >= limits.maxSources) {
    throw new Error(`QUOTA_EXCEEDED: Source limit of ${limits.maxSources} reached on ${plan} plan`);
  }
}

export async function checkTopicQuota(userId: string): Promise<void> {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  const supabase = await createServerSupabaseClient();
  const { count, error } = await supabase
    .from("topics")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (!error && (count || 0) >= limits.maxTopics) {
    throw new Error(`QUOTA_EXCEEDED: Topic limit of ${limits.maxTopics} reached on ${plan} plan`);
  }
}

export async function checkKeywordQuota(userId: string): Promise<void> {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  const supabase = await createServerSupabaseClient();
  const { count, error } = await supabase
    .from("keywords")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (!error && (count || 0) >= limits.maxKeywords) {
    throw new Error(`QUOTA_EXCEEDED: Keyword limit of ${limits.maxKeywords} reached on ${plan} plan`);
  }
}

export async function getUserQuotaUsage(userId: string) {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  const cacheKey = `quota_usage:${userId}`;

  return cache.remember(cacheKey, 30, async () => {
    const supabase = await createServerSupabaseClient();

    const [sourcesRes, topicsRes, keywordsRes] = await Promise.all([
      supabase.from("rss_sources").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("topics").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("keywords").select("*", { count: "exact", head: true }).eq("user_id", userId),
    ]);

    const sources = sourcesRes.count || 0;
    const topics = topicsRes.count || 0;
    const keywords = keywordsRes.count || 0;

    const sourcesPct = Math.min(100, Math.round((sources / limits.maxSources) * 100));
    const topicsPct = Math.min(100, Math.round((topics / limits.maxTopics) * 100));
    const keywordsPct = Math.min(100, Math.round((keywords / limits.maxKeywords) * 100));

    const isNearLimit = sourcesPct >= 80 || topicsPct >= 80 || keywordsPct >= 80;
    const isAtLimit = sourcesPct >= 100 || topicsPct >= 100 || keywordsPct >= 100;

    return {
      plan,
      limits,
      usage: {
        sources,
        topics,
        keywords,
      },
      percentages: {
        sources: sourcesPct,
        topics: topicsPct,
        keywords: keywordsPct,
      },
      isNearLimit,
      isAtLimit,
    };
  });
}

export async function invalidateQuotaUsageCache(userId: string) {
  await cache.del(`quota_usage:${userId}`);
}
