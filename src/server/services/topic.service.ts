import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkTopicQuota } from "./quota.service";
import { Topic } from "@/types/models";

interface TopicDbRow {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at?: string | null;
  keywords?: Array<{ count: number }>;
}

function mapTopicRow(row: TopicDbRow): Topic {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description || undefined,
    keywordsCount: row.keywords?.[0]?.count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

export async function listTopics(userId: string): Promise<Topic[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("topics")
    .select("*, keywords(count)")
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
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", topicId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return mapTopicRow(data as TopicDbRow);
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
