-- ==============================================================================
-- RSSFusion — Phase 8 Migration: Notifications and Preferences
-- Migration: 20261106000001_create_notifications_and_settings.sql
-- ==============================================================================

-- 1. ADD PREFERENCES TO PROFILES
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_email TEXT;

-- 2. EMAIL NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.email_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    keyword_id UUID REFERENCES public.keywords(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
    idempotency_key TEXT NOT NULL UNIQUE,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_status
    ON public.email_notifications(user_id, status);

CREATE INDEX IF NOT EXISTS idx_email_notifications_pending
    ON public.email_notifications(created_at)
    WHERE status = 'pending';

-- RLS
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email notifications"
    ON public.email_notifications
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all notifications"
    ON public.email_notifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
