import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkKeywordQuota } from "./quota.service";

export async function listKeywords(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("keywords")
    .select("*, topics(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createKeyword(
  userId: string,
  input: { keyword: string; topicId?: string }
) {
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
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("CONFLICT: This keyword is already being monitored");
    }
    throw error;
  }

  return data;
}

export async function updateKeyword(
  userId: string,
  keywordId: string,
  updates: { enabled?: boolean; topicId?: string | null }
) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("keywords")
    .update({
      ...(updates.enabled !== undefined && { enabled: updates.enabled }),
      ...(updates.topicId !== undefined && { topic_id: updates.topicId }),
    })
    .eq("id", keywordId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
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
