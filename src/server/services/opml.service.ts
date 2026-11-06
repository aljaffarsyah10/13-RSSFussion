import { createServerSupabaseClient } from "@/lib/supabase/server";
import { parseOpml } from "@/lib/rss/opml-parser";
import { validateFeedUrl } from "@/lib/rss/ssrf-validator";
import { getUserQuotaUsage } from "./quota.service";

export interface OpmlImportResult {
  totalParsed: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  errors: string[];
}

export async function importOpmlFeeds(userId: string, xmlContent: string): Promise<OpmlImportResult> {
  const { feeds } = parseOpml(xmlContent);

  if (!feeds || feeds.length === 0) {
    throw new Error("No valid RSS/Atom feed subscriptions found in the provided OPML file.");
  }

  const supabase = await createServerSupabaseClient();

  // 1. Check existing sources for user
  const { data: existingSources, error: fetchErr } = await supabase
    .from("rss_sources")
    .select("feed_url")
    .eq("user_id", userId);

  if (fetchErr) throw fetchErr;

  const existingUrlSet = new Set((existingSources || []).map((s) => s.feed_url.toLowerCase()));

  // 2. Check quota
  const quota = await getUserQuotaUsage(userId);
  const currentCount = quota.usage.sources;
  const maxAllowed = quota.limits.maxSources;
  let remainingQuota = Math.max(0, maxAllowed - currentCount);

  let importedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const item of feeds) {
    const normalizedUrl = item.xmlUrl.trim();

    // Check duplicate
    if (existingUrlSet.has(normalizedUrl.toLowerCase())) {
      skippedCount++;
      continue;
    }

    // Check quota
    if (remainingQuota <= 0) {
      errors.push(`Quota limit reached (${maxAllowed} sources max on ${quota.plan} plan). Skipped: ${item.title}`);
      skippedCount++;
      continue;
    }

    // SSRF Check
    const ssrf = await validateFeedUrl(normalizedUrl);
    if (!ssrf.valid) {
      failedCount++;
      errors.push(`SSRF rejected "${item.title}": ${ssrf.reason}`);
      continue;
    }

    // Insert source
    const { error: insertErr } = await supabase.from("rss_sources").insert({
      user_id: userId,
      name: item.title || "RSS Feed",
      feed_url: normalizedUrl,
      site_url: item.htmlUrl || "",
      description: item.description || "",
      fetch_interval_minutes: 60,
      enabled: true,
      next_fetch_at: new Date().toISOString(),
    });

    if (insertErr) {
      if (insertErr.code === "23505") {
        skippedCount++;
      } else {
        failedCount++;
        errors.push(`Failed to import "${item.title}": ${insertErr.message}`);
      }
    } else {
      existingUrlSet.add(normalizedUrl.toLowerCase());
      importedCount++;
      remainingQuota--;
    }
  }

  return {
    totalParsed: feeds.length,
    importedCount,
    skippedCount,
    failedCount,
    errors,
  };
}
