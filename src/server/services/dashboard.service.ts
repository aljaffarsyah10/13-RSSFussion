import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getDashboardStats(userId: string) {
  const supabase = await createServerSupabaseClient();

  const [sourcesRes, activeSourcesRes, topicsRes, savedRes] = await Promise.all([
    supabase.from("rss_sources").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("rss_sources")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("enabled", true),
    supabase.from("topics").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("saved_articles").select("*", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  // Today articles
  const yesterdayIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: todayCount } = await supabase
    .from("articles")
    .select("id, rss_sources!inner(user_id)", { count: "exact", head: true })
    .eq("rss_sources.user_id", userId)
    .gte("fetched_at", yesterdayIso);

  return {
    totalSources: sourcesRes.count || 0,
    activeSources: activeSourcesRes.count || 0,
    totalTopics: topicsRes.count || 0,
    totalSavedArticles: savedRes.count || 0,
    totalArticlesToday: todayCount || 0,
  };
}
