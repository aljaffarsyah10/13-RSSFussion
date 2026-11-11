import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkSourceQuota } from "./quota.service";
import { validateFeedUrl } from "@/lib/rss/ssrf-validator";
import { fetchAndParseFeed } from "@/lib/rss/feed-parser";
import { FeedFetchLog, RssSource, SourceStatus } from "@/types/models";

export interface CreateSourceInput {
  name: string;
  feedUrl: string;
  siteUrl?: string;
  description?: string;
  fetchIntervalMinutes?: number;
}

interface SourceDbRow {
  id: string;
  user_id: string;
  name: string;
  feed_url: string;
  site_url?: string | null;
  description?: string | null;
  enabled: boolean;
  last_fetched_at?: string | null;
  last_success_at?: string | null;
  next_fetch_at?: string | null;
  fetch_interval_minutes: number;
  consecutive_failures: number;
  last_error?: string | null;
  created_at: string;
  updated_at?: string | null;
  feed_fetch_logs?: FeedFetchLog[];
}

function mapSourceRow(row: SourceDbRow): RssSource {
  let status: SourceStatus = "healthy";
  if (!row.enabled) {
    status = "disabled";
  } else if (row.consecutive_failures > 0) {
    status = "error";
  } else if (!row.last_fetched_at) {
    status = "pending";
  }

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    feedUrl: row.feed_url,
    siteUrl: row.site_url || "",
    description: row.description || undefined,
    enabled: row.enabled,
    status,
    lastFetchedAt: row.last_fetched_at || undefined,
    lastSuccessAt: row.last_success_at || undefined,
    nextFetchAt: row.next_fetch_at || undefined,
    fetchIntervalMinutes: row.fetch_interval_minutes,
    consecutiveFailures: row.consecutive_failures || 0,
    lastError: row.last_error || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

export async function listSources(userId: string): Promise<RssSource[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("rss_sources")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data || []) as SourceDbRow[]).map(mapSourceRow);
}

export async function createSource(userId: string, input: CreateSourceInput): Promise<RssSource> {
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
      name: input.name.trim() || testParse.title || "RSS Feed",
      feed_url: input.feedUrl.trim(),
      site_url: input.siteUrl?.trim() || testParse.siteUrl || "",
      description: input.description?.trim() || testParse.description || "",
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

  return mapSourceRow(data as SourceDbRow);
}

export async function getSource(userId: string, sourceId: string): Promise<RssSource> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("rss_sources")
    .select("*, feed_fetch_logs(*)")
    .eq("id", sourceId)
    .eq("user_id", userId)
    .single();

  if (error || !data) throw new Error("NOT_FOUND");
  const row = data as SourceDbRow;
  const sortedLogs = [...(row.feed_fetch_logs || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return {
    ...mapSourceRow(row),
    fetchLogs: sortedLogs.slice(0, 25),
  };
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
): Promise<RssSource> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("rss_sources")
    .update({
      ...(updates.name !== undefined && { name: updates.name.trim() }),
      ...(updates.enabled !== undefined && { enabled: updates.enabled }),
      ...(updates.fetchIntervalMinutes !== undefined && {
        fetch_interval_minutes: updates.fetchIntervalMinutes,
      }),
      ...(updates.description !== undefined && { description: updates.description.trim() }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", sourceId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("NOT_FOUND");
    }
    throw error;
  }
  return mapSourceRow(data as SourceDbRow);
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

  const { data: existing, error: checkErr } = await supabase
    .from("rss_sources")
    .select("last_fetched_at")
    .eq("id", sourceId)
    .eq("user_id", userId)
    .single();

  if (checkErr || !existing) throw new Error("NOT_FOUND");

  if (existing.last_fetched_at) {
    const elapsedMs = Date.now() - new Date(existing.last_fetched_at).getTime();
    if (elapsedMs < 60 * 1000) {
      throw new Error(
        "RATE_LIMITED: Please wait at least 60 seconds before manually re-fetching this source."
      );
    }
  }

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
  return mapSourceRow(data as SourceDbRow);
}
