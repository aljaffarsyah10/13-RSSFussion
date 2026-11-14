import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateUserPlanCache, invalidateQuotaUsageCache } from "./quota.service";
import { BillingCycle, BillingInvoice, SubscriptionPlan, SubscriptionRecord } from "@/types/models";

const PLAN_PRICING: Record<SubscriptionPlan, { monthly: number; annual: number }> = {
  free: { monthly: 0, annual: 0 },
  starter: { monthly: 900, annual: 9000 }, // $9/mo or $90/yr ($7.50/mo equivalent)
  pro: { monthly: 2900, annual: 29000 }, // $29/mo or $290/yr ($24.16/mo equivalent)
  business: { monthly: 9900, annual: 99000 }, // $99/mo or $990/yr
};

export async function getUserSubscription(userId: string): Promise<SubscriptionRecord> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    return {
      id: data.id,
      userId: data.user_id,
      plan: data.plan as SubscriptionPlan,
      status: data.status,
      billingCycle: data.billing_cycle,
      currentPeriodStart: data.current_period_start,
      currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: data.cancel_at_period_end,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // Fallback to profile plan if subscription record not created yet
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  const activePlan = (profile?.plan as SubscriptionPlan) || "free";

  return {
    id: `sub_${userId}`,
    userId,
    plan: activePlan,
    status: "active",
    billingCycle: "monthly",
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function changeUserPlan(
  userId: string,
  targetPlan: SubscriptionPlan,
  cycle: BillingCycle = "monthly"
): Promise<{ subscription: SubscriptionRecord; invoice: BillingInvoice }> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createServerSupabaseClient();

  const pricing = PLAN_PRICING[targetPlan] || PLAN_PRICING.free;
  const amountCents = cycle === "annual" ? pricing.annual : pricing.monthly;

  const now = new Date();
  const periodDays = cycle === "annual" ? 365 : 30;
  const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

  // 1. Upsert subscription record
  const { data: subData, error: subErr } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        plan: targetPlan,
        status: "active",
        billing_cycle: cycle,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (subErr) throw subErr;

  // 2. Update profiles table plan
  await supabase
    .from("profiles")
    .update({ plan: targetPlan, updated_at: now.toISOString() })
    .eq("id", userId);

  // 3. Create simulated billing invoice
  const invYear = now.getFullYear();
  const invRandom = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `INV-${invYear}-${invRandom}`;

  const { data: invData, error: invErr } = await supabase
    .from("billing_invoices")
    .insert({
      user_id: userId,
      invoice_number: invoiceNumber,
      amount_cents: amountCents,
      currency: "usd",
      status: "paid",
      plan: targetPlan,
      billing_cycle: cycle,
      paid_at: now.toISOString(),
    })
    .select()
    .single();

  if (invErr) {
    console.error("Failed to generate invoice record:", invErr.message);
  }

  // 4. Invalidate quota & plan cache
  await Promise.all([
    invalidateUserPlanCache(userId),
    invalidateQuotaUsageCache(userId),
  ]).catch(() => {});

  const subscription: SubscriptionRecord = {
    id: subData.id,
    userId: subData.user_id,
    plan: subData.plan,
    status: subData.status,
    billingCycle: subData.billing_cycle,
    currentPeriodStart: subData.current_period_start,
    currentPeriodEnd: subData.current_period_end,
    cancelAtPeriodEnd: subData.cancel_at_period_end,
    createdAt: subData.created_at,
    updatedAt: subData.updated_at,
  };

  const invoice: BillingInvoice = invData
    ? {
        id: invData.id,
        userId: invData.user_id,
        invoiceNumber: invData.invoice_number,
        amountCents: invData.amount_cents,
        currency: invData.currency,
        status: invData.status,
        plan: invData.plan,
        billingCycle: invData.billing_cycle,
        paidAt: invData.paid_at,
        createdAt: invData.created_at,
      }
    : {
        id: `inv_${Date.now()}`,
        userId,
        invoiceNumber,
        amountCents,
        currency: "usd",
        status: "paid",
        plan: targetPlan,
        billingCycle: cycle,
        paidAt: now.toISOString(),
        createdAt: now.toISOString(),
      };

  return { subscription, invoice };
}

export async function cancelSubscription(userId: string): Promise<SubscriptionRecord> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    plan: data.plan,
    status: data.status,
    billingCycle: data.billing_cycle,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: true,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function listUserInvoices(userId: string): Promise<BillingInvoice[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("billing_invoices")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    invoiceNumber: row.invoice_number,
    amountCents: row.amount_cents,
    currency: row.currency,
    status: row.status,
    plan: row.plan,
    billingCycle: row.billing_cycle,
    paidAt: row.paid_at || undefined,
    createdAt: row.created_at,
  }));
}
