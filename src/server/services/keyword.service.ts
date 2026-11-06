import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkKeywordQuota } from "./quota.service";
import { Keyword } from "@/types/models";

interface KeywordDbRow {
  id: string;
  user_id: string;
  topic_id?: string | null;
  keyword: string;
  enabled: boolean;
  created_at: string;
  topics?: { name: string } | null;
}

function mapKeywordRow(row: KeywordDbRow): Keyword {
  return {
    id: row.id,
    userId: row.user_id,
    topicId: row.topic_id || undefined,
    topicName: row.topics?.name || undefined,
    keyword: row.keyword,
    enabled: row.enabled,
    createdAt: row.created_at,
  };
}

export async function listKeywords(userId: string): Promise<Keyword[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("keywords")
    .select("*, topics(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data || []) as unknown as KeywordDbRow[]).map(mapKeywordRow);
}

export async function createKeyword(
  userId: string,
  input: { keyword: string; topicId?: string }
): Promise<Keyword> {
  await checkKeywordQuota(userId);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("keywords")
    .insert({
      user_id: userId,
      keyword: input.keyword.trim(),
      topic_id: input.topicId || null,
      enabled: true,
    })
    .select("*, topics(name)")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("CONFLICT: This keyword is already being monitored");
    }
    throw error;
  }

  return mapKeywordRow(data as unknown as KeywordDbRow);
}

export async function updateKeyword(
  userId: string,
  keywordId: string,
  updates: { enabled?: boolean; topicId?: string | null }
): Promise<Keyword> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("keywords")
    .update({
      ...(updates.enabled !== undefined && { enabled: updates.enabled }),
      ...(updates.topicId !== undefined && { topic_id: updates.topicId }),
    })
    .eq("id", keywordId)
    .eq("user_id", userId)
    .select("*, topics(name)")
    .single();

  if (error) throw error;
  return mapKeywordRow(data as unknown as KeywordDbRow);
}

export async function deleteKeyword(userId: string, keywordId: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("keywords")
    .delete()
    .eq("id", keywordId)
    .eq("user_id", userId);

  if (error) throw error;
  return { success: true };
}
