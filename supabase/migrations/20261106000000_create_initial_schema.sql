-- ==============================================================================
-- RSSFusion — Initial Schema Migration
-- Migration: 20261106000000_create_initial_schema.sql
-- Description: Core tables, constraints, indexes, RLS policies, and triggers
-- ==============================================================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'business')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. RSS SOURCES
CREATE TABLE IF NOT EXISTS public.rss_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    feed_url TEXT NOT NULL,
    site_url TEXT,
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT true,
    last_fetched_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    next_fetch_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    fetch_interval_minutes INTEGER NOT NULL DEFAULT 60 CHECK (fetch_interval_minutes >= 15 AND fetch_interval_minutes <= 1440),
    consecutive_failures INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_error TEXT,
    etag TEXT,
    last_modified TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_rss_sources_user_feed UNIQUE (user_id, feed_url)
);

-- 3. ARTICLES
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES public.rss_sources(id) ON DELETE CASCADE,
    guid TEXT,
    canonical_url TEXT NOT NULL,
    original_url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    content_snippet TEXT,
    author TEXT,
    image_url TEXT,
    published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_articles_source_canonical UNIQUE (source_id, canonical_url)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_articles_source_guid
    ON public.articles(source_id, guid)
    WHERE guid IS NOT NULL;

-- 4. TOPICS
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_topics_user_name UNIQUE (user_id, name)
);

-- 5. KEYWORDS
CREATE TABLE IF NOT EXISTS public.keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_keywords_user_keyword UNIQUE (user_id, keyword)
);

-- 6. ARTICLE KEYWORD MATCHES
CREATE TABLE IF NOT EXISTS public.article_keyword_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    keyword_id UUID NOT NULL REFERENCES public.keywords(id) ON DELETE CASCADE,
    matched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_matches_article_keyword UNIQUE (article_id, keyword_id)
);

-- 7. SAVED ARTICLES
CREATE TABLE IF NOT EXISTS public.saved_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_saved_user_article UNIQUE (user_id, article_id)
);

-- 8. ARTICLE READ STATUS
CREATE TABLE IF NOT EXISTS public.article_read_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_read_user_article UNIQUE (user_id, article_id)
);

-- 9. FEED FETCH LOGS
CREATE TABLE IF NOT EXISTS public.feed_fetch_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES public.rss_sources(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'not_modified')),
    http_status INTEGER,
    articles_found INTEGER NOT NULL DEFAULT 0,
    articles_inserted INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_rss_sources_user_id ON public.rss_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_rss_sources_due ON public.rss_sources(next_fetch_at) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_articles_source_published ON public.articles(source_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_published ON public.articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_keywords_user_id ON public.keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_keywords_topic_id ON public.keywords(topic_id);
CREATE INDEX IF NOT EXISTS idx_matches_keyword_id ON public.article_keyword_matches(keyword_id);
CREATE INDEX IF NOT EXISTS idx_matches_article_id ON public.article_keyword_matches(article_id);
CREATE INDEX IF NOT EXISTS idx_saved_user_id ON public.saved_articles(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_read_user_id ON public.article_read_status(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_source_created ON public.feed_fetch_logs(source_id, created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_keyword_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_fetch_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can select and update their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- RSS Sources: User CRUD
CREATE POLICY "sources_select_own" ON public.rss_sources
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sources_insert_own" ON public.rss_sources
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sources_update_own" ON public.rss_sources
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sources_delete_own" ON public.rss_sources
    FOR DELETE USING (auth.uid() = user_id);

-- Articles: Read-only access through sources owned by the user
CREATE POLICY "articles_select_via_sources" ON public.articles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.rss_sources s
            WHERE s.id = articles.source_id AND s.user_id = auth.uid()
        )
    );

-- Topics: User CRUD
CREATE POLICY "topics_select_own" ON public.topics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "topics_insert_own" ON public.topics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "topics_update_own" ON public.topics
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "topics_delete_own" ON public.topics
    FOR DELETE USING (auth.uid() = user_id);

-- Keywords: User CRUD
CREATE POLICY "keywords_select_own" ON public.keywords
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "keywords_insert_own" ON public.keywords
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "keywords_update_own" ON public.keywords
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "keywords_delete_own" ON public.keywords
    FOR DELETE USING (auth.uid() = user_id);

-- Article Keyword Matches: Select via owned keywords
CREATE POLICY "matches_select_via_keywords" ON public.article_keyword_matches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.keywords k
            WHERE k.id = article_keyword_matches.keyword_id AND k.user_id = auth.uid()
        )
    );

-- Saved Articles: User CRUD
CREATE POLICY "saved_select_own" ON public.saved_articles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "saved_insert_own" ON public.saved_articles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_delete_own" ON public.saved_articles
    FOR DELETE USING (auth.uid() = user_id);

-- Read Status: User CRUD
CREATE POLICY "read_select_own" ON public.article_read_status
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "read_insert_own" ON public.article_read_status
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "read_delete_own" ON public.article_read_status
    FOR DELETE USING (auth.uid() = user_id);

-- Feed Fetch Logs: Select via owned sources
CREATE POLICY "logs_select_via_sources" ON public.feed_fetch_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.rss_sources s
            WHERE s.id = feed_fetch_logs.source_id AND s.user_id = auth.uid()
        )
    );

-- ==============================================================================
-- TRIGGERS: Auto-create Profile on Signup
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, plan)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        'free'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- TRIGGERS: Database Backstop Quota Check (FR-13)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.enforce_source_quota()
RETURNS TRIGGER AS $$
DECLARE
    user_plan TEXT;
    current_count INTEGER;
    max_limit INTEGER := 5; -- default free
BEGIN
    SELECT plan INTO user_plan FROM public.profiles WHERE id = NEW.user_id;
    IF user_plan = 'starter' THEN
        max_limit := 30;
    ELSIF user_plan = 'pro' THEN
        max_limit := 100;
    ELSIF user_plan = 'business' THEN
        max_limit := 999999;
    END IF;

    SELECT COUNT(*) INTO current_count FROM public.rss_sources WHERE user_id = NEW.user_id;
    IF current_count >= max_limit THEN
        RAISE EXCEPTION 'QUOTA_EXCEEDED: Source limit of % reached for current plan', max_limit;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_source_quota ON public.rss_sources;
CREATE TRIGGER trg_enforce_source_quota
    BEFORE INSERT ON public.rss_sources
    FOR EACH ROW EXECUTE FUNCTION public.enforce_source_quota();
