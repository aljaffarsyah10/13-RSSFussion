import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkSourceQuota } from "./quota.service";
import { validateFeedUrl } from "@/lib/rss/ssrf-validator";
import { fetchAndParseFeed } from "@/lib/rss/feed-parser";

export interface CreateSourceInput {
  name: string;
  feedUrl: string;
  siteUrl?: string;
  description?: string;
  fetchIntervalMinutes?: number;
}

export async function listSources(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("rss_sources")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createSource(userId: string, input: CreateSourceInput) {
  // 1. Quota Check
  await checkSourceQuota(userId);

  // 2. SSRF Check
  const ssrf = await validateFeedUrl(input.feedUrl);
  if (!ssrf.valid) {
    throw new Error(`SSRF_REJECTED: ${ssrf.reason}`);
  }

  // 3. Test Parse feed to ensure validity
  const testParse = await fetchAndParseFeed(input.feedUrl, "test-verify");

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("rss_sources")
    .insert({
      user_id: userId,
      name: input.name || testParse.title || "RSS Feed",
      feedUrl: input.feedUrl,
      siteUrl: input.siteUrl || testParse.siteUrl || "",
      description: input.description || testParse.description || "",
      fetch_interval_minutes: input.fetchIntervalMinutes || 60,
      enabled: true,
      next_fetch_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("CONFLICT: You have already added this feed URL");
    }
    throw error;
  }

  return data;
}

export async function getSource(userId: string, sourceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("rss_sources")
    .select("*, feed_fetch_logs(*)")
    .eq("id", sourceId)
    .eq("user_id", userId)
    .single();

  if (error) throw new Error("NOT_FOUND");
  return data;
}

export async function updateSource(
  userId: string,
  sourceId: string,
  updates: {
    name?: string;
    enabled?: boolean;
    fetchIntervalMinutes?: number;
    description?: string;
  }
) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("rss_sources")
    .update({
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.enabled !== undefined && { enabled: updates.enabled }),
      ...(updates.fetchIntervalMinutes !== undefined && {
        fetch_interval_minutes: updates.fetchIntervalMinutes,
      }),
      ...(updates.description !== undefined && { description: updates.description }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", sourceId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSource(userId: string, sourceId: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("rss_sources")
    .delete()
    .eq("id", sourceId)
    .eq("user_id", userId);

  if (error) throw error;
  return { success: true };
}

export async function refreshSource(userId: string, sourceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("rss_sources")
    .update({
      next_fetch_at: new Date().toISOString(),
      locked_until: null,
    })
    .eq("id", sourceId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
