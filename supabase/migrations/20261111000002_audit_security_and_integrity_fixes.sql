-- ==============================================================================
-- RSSFusion — Audit Security, Quota Backstops, and Integrity Migration
-- Migration: 20261111000002_audit_security_and_integrity_fixes.sql
-- Description:
--   1. Restrict email_notifications management policy strictly to service_role
--   2. Automatic updated_at maintenance triggers on mutable tables
--   3. Database-level quota enforcement triggers for topics and keywords
--   4. Case-insensitive uniqueness indexes for topics and keywords
-- ==============================================================================

-- 1. FIX RLS POLICY SCOPE ON EMAIL NOTIFICATIONS
DROP POLICY IF EXISTS "Service role can manage all notifications" ON public.email_notifications;
CREATE POLICY "Service role can manage all notifications"
    ON public.email_notifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 2. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_rss_sources_updated_at ON public.rss_sources;
CREATE TRIGGER trg_rss_sources_updated_at
    BEFORE UPDATE ON public.rss_sources
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_topics_updated_at ON public.topics;
CREATE TRIGGER trg_topics_updated_at
    BEFORE UPDATE ON public.topics
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. DATABASE BACKSTOP QUOTA TRIGGERS FOR TOPICS & KEYWORDS
CREATE OR REPLACE FUNCTION public.enforce_topic_quota()
RETURNS TRIGGER AS $$
DECLARE
    user_plan TEXT;
    current_count INTEGER;
    max_limit INTEGER := 3; -- default free
BEGIN
    SELECT plan INTO user_plan FROM public.profiles WHERE id = NEW.user_id;
    IF user_plan = 'starter' THEN
        max_limit := 20;
    ELSIF user_plan = 'pro' THEN
        max_limit := 100;
    ELSIF user_plan = 'business' THEN
        max_limit := 999999;
    END IF;

    SELECT COUNT(*) INTO current_count FROM public.topics WHERE user_id = NEW.user_id;
    IF current_count >= max_limit THEN
        RAISE EXCEPTION 'QUOTA_EXCEEDED: Topic limit of % reached for current plan', max_limit;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_topic_quota ON public.topics;
CREATE TRIGGER trg_enforce_topic_quota
    BEFORE INSERT ON public.topics
    FOR EACH ROW EXECUTE FUNCTION public.enforce_topic_quota();

CREATE OR REPLACE FUNCTION public.enforce_keyword_quota()
RETURNS TRIGGER AS $$
DECLARE
    user_plan TEXT;
    current_count INTEGER;
    max_limit INTEGER := 3; -- default free
BEGIN
    SELECT plan INTO user_plan FROM public.profiles WHERE id = NEW.user_id;
    IF user_plan = 'starter' THEN
        max_limit := 20;
    ELSIF user_plan = 'pro' THEN
        max_limit := 100;
    ELSIF user_plan = 'business' THEN
        max_limit := 999999;
    END IF;

    SELECT COUNT(*) INTO current_count FROM public.keywords WHERE user_id = NEW.user_id;
    IF current_count >= max_limit THEN
        RAISE EXCEPTION 'QUOTA_EXCEEDED: Keyword limit of % reached for current plan', max_limit;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_keyword_quota ON public.keywords;
CREATE TRIGGER trg_enforce_keyword_quota
    BEFORE INSERT ON public.keywords
    FOR EACH ROW EXECUTE FUNCTION public.enforce_keyword_quota();

-- 4. CASE-INSENSITIVE UNIQUENESS & PERFORMANCE INDEXES
CREATE UNIQUE INDEX IF NOT EXISTS uq_topics_user_lower_name
    ON public.topics(user_id, lower(name));

CREATE UNIQUE INDEX IF NOT EXISTS uq_keywords_user_lower_keyword
    ON public.keywords(user_id, lower(keyword));
