-- ==============================================================================
-- RSSFusion — SaaS Infrastructure: Subscriptions, Billing, Invoices & Onboarding
-- Migration: 20261114000004_saas_billing_and_onboarding.sql
-- Description:
--   1. Create subscriptions table for plan management and renewal tracking
--   2. Create billing_invoices table for invoice receipts and transaction history
--   3. Enhance profiles with organization_name, workspace role, and onboarding_completed
--   4. Enable RLS and create security policies
-- ==============================================================================

-- 1. PROFILES ENHANCEMENT
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS organization_name TEXT DEFAULT 'Personal Workspace',
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'owner',
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- 2. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'business')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_subscriptions_user UNIQUE (user_id)
);

-- 3. BILLING INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.billing_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'failed', 'refunded')),
    plan TEXT NOT NULL,
    billing_cycle TEXT NOT NULL,
    paid_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_user_created ON public.billing_invoices(user_id, created_at DESC);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_service_all" ON public.subscriptions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "invoices_select_own" ON public.billing_invoices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "invoices_service_all" ON public.billing_invoices
    FOR ALL TO service_role USING (true) WITH CHECK (true);
