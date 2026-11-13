import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkTopicQuota, invalidateQuotaUsageCache } from "./quota.service";
import { invalidateDashboardStatsCache } from "./dashboard.service";
import { invalidateAnalyticsCache } from "./analytics.service";
import { Topic } from "@/types/models";

async function invalidateTopicCaches(userId: string) {
  await Promise.all([
    invalidateDashboardStatsCache(userId),
    invalidateAnalyticsCache(userId),
    invalidateQuotaUsageCache(userId),
  ]).catch(() => {});
}

interface TopicKeywordNested {
  id: string;
  article_keyword_matches?: Array<{ article_id: string }>;
}

interface TopicDbRow {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at?: string | null;
  keywords?: TopicKeywordNested[];
}

function mapTopicRow(row: TopicDbRow): Topic {
  const kwList = Array.isArray(row.keywords) ? row.keywords : [];
  const distinctArticles = new Set<string>();

  for (const kw of kwList) {
    if (Array.isArray(kw.article_keyword_matches)) {
      for (const m of kw.article_keyword_matches) {
        if (m.article_id) {
          distinctArticles.add(m.article_id);
        }
      }
    }
  }

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description || undefined,
    keywordsCount: kwList.length,
    articlesCount: distinctArticles.size,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

export async function listTopics(userId: string): Promise<Topic[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("topics")
    .select("*, keywords(id, article_keyword_matches(article_id))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data || []) as unknown as TopicDbRow[]).map(mapTopicRow);
}

export async function createTopic(
  userId: string,
  input: { name: string; description?: string }
): Promise<Topic> {
  await checkTopicQuota(userId);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("topics")
    .insert({
      user_id: userId,
      name: input.name.trim(),
      description: input.description?.trim() || "",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("CONFLICT: A topic with this name already exists");
    }
    throw error;
  }

  await invalidateTopicCaches(userId);

  return mapTopicRow(data as TopicDbRow);
}

export async function updateTopic(
  userId: string,
  topicId: string,
  updates: { name?: string; description?: string }
): Promise<Topic> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("topics")
    .update({
      ...(updates.name !== undefined && { name: updates.name.trim() }),
      ...(updates.description !== undefined && { description: updates.description.trim() }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", topicId)
    .eq("user_id", userId)
    .select("*, keywords(id, article_keyword_matches(article_id))")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("NOT_FOUND");
    }
    if (error.code === "23505") {
      throw new Error("CONFLICT: A topic with this name already exists");
    }
    throw error;
  }

  await invalidateTopicCaches(userId);

  return mapTopicRow(data as unknown as TopicDbRow);
}

export async function deleteTopic(userId: string, topicId: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("topics")
    .delete()
    .eq("id", topicId)
    .eq("user_id", userId);

  if (error) throw error;

  await invalidateTopicCaches(userId);

  return { success: true };
}
