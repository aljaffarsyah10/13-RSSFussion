import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkTopicQuota } from "./quota.service";

export async function listTopics(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("topics")
    .select("*, keywords(count)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createTopic(
  userId: string,
  input: { name: string; description?: string }
) {
  await checkTopicQuota(userId);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("topics")
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description || "",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("CONFLICT: A topic with this name already exists");
    }
    throw error;
  }

  return data;
}

export async function updateTopic(
  userId: string,
  topicId: string,
  updates: { name?: string; description?: string }
) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("topics")
    .update({
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", topicId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTopic(userId: string, topicId: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("topics")
    .delete()
    .eq("id", topicId)
    .eq("user_id", userId);

  if (error) throw error;
  return { success: true };
}
