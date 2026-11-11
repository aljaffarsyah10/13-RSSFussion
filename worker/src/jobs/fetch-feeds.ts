import { Pool } from "pg";
import { logger } from "../utils/logger.js";
import { fetchFeed } from "../services/feed-fetcher.js";
import { matchKeywordsInText } from "../services/keyword-matcher.js";

interface ClaimedSource {
  id: string;
  user_id: string;
  name: string;
  feed_url: string;
  etag: string | null;
  last_modified: string | null;
  consecutive_failures: number;
  fetch_interval_minutes: number;
}

export async function processFeedsJob(pool: Pool, concurrency: number) {
  const client = await pool.connect();
  let sources: ClaimedSource[] = [];

  try {
    // 1. Atomic job claim with FOR UPDATE SKIP LOCKED
    await client.query("BEGIN;");
    const claimQuery = `
      UPDATE rss_sources s
      SET locked_until = now() + interval '5 minutes',
          last_fetched_at = now()
      FROM (
        SELECT id FROM rss_sources
        WHERE enabled = true
          AND next_fetch_at <= now()
          AND (locked_until IS NULL OR locked_until < now())
        ORDER BY next_fetch_at
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      ) due
      WHERE s.id = due.id
      RETURNING s.id, s.user_id, s.name, s.feed_url, s.etag, s.last_modified, s.consecutive_failures, s.fetch_interval_minutes;
    `;
    const res = await client.query(claimQuery, [concurrency]);
    sources = res.rows;
    await client.query("COMMIT;");
  } catch (err: unknown) {
    await client.query("ROLLBACK;");
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Failed to claim due sources from PostgreSQL", { error: message });
    return;
  } finally {
    client.release();
  }

  if (sources.length === 0) {
    logger.debug("No due RSS sources to fetch at this interval");
    return;
  }

  logger.info(`Claimed ${sources.length} sources for background ingestion`, {
    sourceIds: sources.map((s) => s.id),
  });

  // 2. Process claimed sources concurrently
  await Promise.all(sources.map((source) => processSingleSource(pool, source)));
}

async function processSingleSource(pool: Pool, source: ClaimedSource) {
  const startTime = Date.now();
  logger.info(`Starting ingestion for source: ${source.name}`, { sourceId: source.id });

  try {
    // Fetch and parse
    const result = await fetchFeed(source.feed_url, source.id, {
      etag: source.etag || undefined,
      lastModified: source.last_modified || undefined,
    });

    const durationMs = Date.now() - startTime;

    // Handle 304 Not Modified
    if (result.notModified) {
      logger.info(`Source not modified (HTTP 304): ${source.name}`, { sourceId: source.id });
      await pool.query(
        `
        UPDATE rss_sources
        SET locked_until = NULL,
            last_success_at = now(),
            consecutive_failures = 0,
            last_error = NULL,
            next_fetch_at = now() + ($1 || ' minutes')::interval
        WHERE id = $2;
        `,
        [source.fetch_interval_minutes, source.id]
      );

      await recordFetchLog(pool, {
        sourceId: source.id,
        status: "not_modified",
        httpStatus: 304,
        articlesFound: 0,
        articlesInserted: 0,
        durationMs,
      });
      return;
    }

    // Insert articles with deduplication
    let insertedArticles: Array<{ id: string; title: string; description: string; content_snippet?: string }> = [];

    for (const item of result.items) {
      const insertQuery = `
        INSERT INTO articles (
          source_id, guid, canonical_url, original_url, title,
          description, content_snippet, author, image_url, published_at, fetched_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
        ON CONFLICT DO NOTHING
        RETURNING id, title, description, content_snippet;
      `;
      const insertRes = await pool.query(insertQuery, [
        source.id,
        item.guid,
        item.canonicalUrl,
        item.originalUrl,
        item.title,
        item.description,
        item.contentSnippet || null,
        item.author || null,
        item.imageUrl || null,
        item.publishedAt,
      ]);

      if (insertRes.rows.length > 0) {
        insertedArticles.push(insertRes.rows[0]);
      }
    }

    // Match keywords for newly inserted articles
    if (insertedArticles.length > 0) {
      const keywordsRes = await pool.query(
        `SELECT id, keyword FROM keywords WHERE user_id = $1 AND enabled = true;`,
        [source.user_id]
      );
      const userKeywords = keywordsRes.rows;

      if (userKeywords.length > 0) {
        for (const art of insertedArticles) {
          const haystack = `${art.title} ${art.description} ${art.content_snippet || ""}`;
          const matchedKwIds = matchKeywordsInText(haystack, userKeywords);

          for (const kwId of matchedKwIds) {
            await pool.query(
              `
              INSERT INTO article_keyword_matches (article_id, keyword_id)
              VALUES ($1, $2)
              ON CONFLICT (article_id, keyword_id) DO NOTHING;
              `,
              [art.id, kwId]
            );

            // Queue email notification with idempotency check
            const matchedKwObj = userKeywords.find((k: { id: string; keyword: string }) => k.id === kwId);
            const kwName = matchedKwObj?.keyword || "keyword";
            await pool.query(
              `
              INSERT INTO email_notifications (
                user_id, article_id, keyword_id, recipient_email, subject, idempotency_key, status
              )
              SELECT
                $1, $2, $3, COALESCE(p.notification_email, u.email),
                '[RSSFusion Alert] Keyword "' || $4 || '" matched: ' || $5,
                'kw_notif_' || $1 || '_' || $2 || '_' || $3,
                'pending'
              FROM auth.users u
              LEFT JOIN profiles p ON p.id = u.id
              WHERE u.id = $1 AND COALESCE(p.email_notifications_enabled, true) = true
              ON CONFLICT (idempotency_key) DO NOTHING;
              `,
              [source.user_id, art.id, kwId, kwName, art.title]
            );
          }
        }
      }
    }

    // Update Source status on success
    await pool.query(
      `
      UPDATE rss_sources
      SET locked_until = NULL,
          last_success_at = now(),
          consecutive_failures = 0,
          last_error = NULL,
          etag = $1,
          last_modified = $2,
          next_fetch_at = now() + ($3 || ' minutes')::interval
      WHERE id = $4;
      `,
      [result.etag || null, result.lastModified || null, source.fetch_interval_minutes, source.id]
    );

    await recordFetchLog(pool, {
      sourceId: source.id,
      status: "success",
      httpStatus: result.httpStatus,
      articlesFound: result.items.length,
      articlesInserted: insertedArticles.length,
      durationMs,
    });

    logger.info(`Completed ingestion for: ${source.name}`, {
      sourceId: source.id,
      found: result.items.length,
      inserted: insertedArticles.length,
      durationMs,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const durationMs = Date.now() - startTime;
    const failures = source.consecutive_failures + 1;
    // Exponential backoff: min(interval * 2^failures, 1440m)
    const backoffMinutes = Math.min(source.fetch_interval_minutes * Math.pow(2, failures), 1440);

    logger.error(`Error ingesting feed: ${source.name}`, {
      sourceId: source.id,
      error: errorMessage,
      failures,
      backoffMinutes,
    });

    await pool.query(
      `
      UPDATE rss_sources
      SET locked_until = NULL,
          consecutive_failures = $1,
          last_error = $2,
          next_fetch_at = now() + ($3 || ' minutes')::interval
      WHERE id = $4;
      `,
      [failures, errorMessage.slice(0, 500) || "Unknown error", backoffMinutes, source.id]
    );

    await recordFetchLog(pool, {
      sourceId: source.id,
      status: "failed",
      errorMessage,
      durationMs,
    });
  }
}

async function recordFetchLog(
  pool: Pool,
  data: {
    sourceId: string;
    status: "success" | "failed" | "not_modified";
    httpStatus?: number;
    articlesFound?: number;
    articlesInserted?: number;
    errorMessage?: string;
    durationMs: number;
  }
) {
  try {
    await pool.query(
      `
      INSERT INTO feed_fetch_logs (
        source_id, status, http_status, articles_found, articles_inserted, error_message, duration_ms
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7);
      `,
      [
        data.sourceId,
        data.status,
        data.httpStatus || null,
        data.articlesFound || 0,
        data.articlesInserted || 0,
        data.errorMessage || null,
        data.durationMs,
      ]
    );
  } catch (logErr: unknown) {
    const message = logErr instanceof Error ? logErr.message : String(logErr);
    logger.warn("Failed to write to feed_fetch_logs", { error: message });
  }
}
