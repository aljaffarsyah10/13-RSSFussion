-- ==============================================================================
-- RSSFusion — Performance & Scalability Indexing Migration
-- Migration: 20261113000003_performance_and_scalability_indexes.sql
-- Description:
--   1. Enable pg_trgm extension for high-performance substring/regex search
--   2. Trigram GIN indexes for articles search (title, description)
--   3. Composite indexes for high-throughput pagination, filtering, and tenant lookups
--   4. Indexing for feed fetch logs and ingestion trend aggregation
-- ==============================================================================

-- 1. EXTENSIONS FOR ACCELERATED SEARCH
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. HIGH-PERFORMANCE SEARCH INDEXES (TRIGRAM GIN)
-- Enables sub-millisecond ILIKE / regex search across hundreds of thousands of articles
CREATE INDEX IF NOT EXISTS idx_articles_trgm_title_desc
    ON public.articles
    USING gin (title gin_trgm_ops, description gin_trgm_ops);

-- 3. ARTICLES QUERY & PAGINATION ACCELERATION INDEXES
-- Index for timeframe / trend analytics lookups (gte fetched_at)
CREATE INDEX IF NOT EXISTS idx_articles_fetched_at_desc
    ON public.articles(fetched_at DESC);

-- Covering composite index for source-scoped cursor pagination
CREATE INDEX IF NOT EXISTS idx_articles_source_pub_id
    ON public.articles(source_id, published_at DESC, id);

-- 4. MULTI-TENANT FILTERING & STATUS LOOKUP INDEXES
-- Fast count & filter for active user sources
CREATE INDEX IF NOT EXISTS idx_rss_sources_user_enabled
    ON public.rss_sources(user_id, enabled);

-- Rapid read status & saved state lookup for article cards and join operations
CREATE INDEX IF NOT EXISTS idx_read_user_article_composite
    ON public.article_read_status(user_id, article_id);

CREATE INDEX IF NOT EXISTS idx_saved_user_article_composite
    ON public.saved_articles(user_id, article_id);

-- Rapid article keyword match lookup
CREATE INDEX IF NOT EXISTS idx_matches_kw_art_composite
    ON public.article_keyword_matches(keyword_id, article_id);

-- 5. FEED FETCH LOG RETENTION & MONITORING INDEX
CREATE INDEX IF NOT EXISTS idx_logs_source_status_created
    ON public.feed_fetch_logs(source_id, status, created_at DESC);
