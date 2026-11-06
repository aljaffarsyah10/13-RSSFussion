import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface TrendAnalytics {
  articlesPerDay: Array<{ date: string; label: string; count: number }>;
  topicDistribution: Array<{ name: string; count: number }>;
  topSources: Array<{ name: string; count: number }>;
  totalIngestedPastWeek: number;
}

export async function getTrendAnalytics(userId: string): Promise<TrendAnalytics> {
  const supabase = await createServerSupabaseClient();

  // 1. Ingestion past 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data: articles, error: artErr } = await supabase
    .from("articles")
    .select("id, fetched_at, rss_sources!inner(name, user_id)")
    .eq("rss_sources.user_id", userId)
    .gte("fetched_at", sevenDaysAgo.toISOString())
    .order("fetched_at", { ascending: true });

  if (artErr) throw artErr;

  // Group by day (YYYY-MM-DD)
  const dayBuckets: Record<string, { label: string; count: number }> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });
    dayBuckets[key] = { label, count: 0 };
  }

  const sourceCounts: Record<string, number> = {};

  for (const a of articles || []) {
    const key = (a.fetched_at || "").split("T")[0];
    if (dayBuckets[key]) {
      dayBuckets[key].count++;
    }
    const sName = (a.rss_sources as unknown as { name?: string })?.name || "Feed";
    sourceCounts[sName] = (sourceCounts[sName] || 0) + 1;
  }

  const articlesPerDay = Object.entries(dayBuckets).map(([date, val]) => ({
    date,
    label: val.label,
    count: val.count,
  }));

  // Top sources
  const topSources = Object.entries(sourceCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 2. Topic distribution
  const { data: topics } = await supabase
    .from("topics")
    .select("name, keywords(article_keyword_matches(count))")
    .eq("user_id", userId);

  const topicDistribution = (topics || []).map((t) => {
    let count = 0;
    if (Array.isArray(t.keywords)) {
      for (const kw of t.keywords) {
        if (Array.isArray(kw.article_keyword_matches) && kw.article_keyword_matches[0]?.count) {
          count += kw.article_keyword_matches[0].count;
        }
      }
    }
    return { name: t.name, count };
  });

  return {
    articlesPerDay,
    topicDistribution,
    topSources,
    totalIngestedPastWeek: (articles || []).length,
  };
}
