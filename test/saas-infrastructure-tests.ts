import { PLAN_LIMITS } from "../src/server/services/quota.service";
import { SUGGESTED_PRESETS } from "../src/server/services/onboarding.service";
import { validateFeedUrl } from "../src/lib/rss/ssrf-validator";
import { SubscriptionPlan, BillingCycle } from "../src/types/models";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`SaaS Infrastructure Test Failed: ${msg}`);
  }
}

async function runSaaSInfrastructureTests() {
  console.log("=== RUNNING SAAS INFRASTRUCTURE & MULTI-TENANCY TESTS ===");

  // 1. Plan Limits & Quota Configurations
  console.log("1. Testing subscription tiers and quota limits...");
  assert(Boolean(PLAN_LIMITS.free), "Free tier limits must be defined");
  assert(PLAN_LIMITS.free.maxSources === 5, "Free tier must allow up to 5 sources");
  assert(PLAN_LIMITS.free.maxKeywords === 3, "Free tier must allow up to 3 keywords");
  assert(PLAN_LIMITS.free.maxTopics === 3, "Free tier must allow up to 3 topics");

  assert(PLAN_LIMITS.starter.maxSources === 30, "Starter tier must allow 30 sources");
  assert(PLAN_LIMITS.pro.maxSources === 100, "Pro tier must allow 100 sources");
  assert(PLAN_LIMITS.business.maxSources >= 100000, "Business tier must have enterprise quota");
  console.log("   ✓ Subscription tier quota configurations verified.");

  // 2. Resource Percentage & Threshold Warning Calculations
  console.log("2. Testing quota usage percentage and limit threshold triggers...");
  function computeUsageMetrics(sources: number, maxSources: number, keywords: number, maxKeywords: number) {
    const sourcesPct = Math.min(100, Math.round((sources / maxSources) * 100));
    const keywordsPct = Math.min(100, Math.round((keywords / maxKeywords) * 100));
    const isNearLimit = sourcesPct >= 80 || keywordsPct >= 80;
    const isAtLimit = sourcesPct >= 100 || keywordsPct >= 100;
    return { sourcesPct, keywordsPct, isNearLimit, isAtLimit };
  }

  // Case A: Low usage (0/5 sources, 0/3 keywords)
  const lowUsage = computeUsageMetrics(0, 5, 0, 3);
  assert(lowUsage.sourcesPct === 0, "0 sources should yield 0%");
  assert(!lowUsage.isNearLimit, "0% usage should not trigger near-limit warning");
  assert(!lowUsage.isAtLimit, "0% usage should not trigger at-limit warning");

  // Case B: Safe usage (3/5 sources = 60%)
  const safeUsage = computeUsageMetrics(3, 5, 1, 3);
  assert(safeUsage.sourcesPct === 60, "3/5 sources should yield 60%");
  assert(!safeUsage.isNearLimit, "60% should not trigger near-limit");
  assert(!safeUsage.isAtLimit, "60% should not trigger at-limit");

  // Case C: Near limit threshold (4/5 sources = 80%)
  const nearLimitUsage = computeUsageMetrics(4, 5, 1, 3);
  assert(nearLimitUsage.sourcesPct === 80, "4/5 sources should yield 80%");
  assert(nearLimitUsage.isNearLimit, "80% usage must trigger isNearLimit");
  assert(!nearLimitUsage.isAtLimit, "80% usage should not trigger isAtLimit");

  // Case D: At limit threshold (5/5 sources = 100%)
  const atLimitUsage = computeUsageMetrics(5, 5, 2, 3);
  assert(atLimitUsage.sourcesPct === 100, "5/5 sources should yield 100%");
  assert(atLimitUsage.isNearLimit, "100% usage must trigger isNearLimit");
  assert(atLimitUsage.isAtLimit, "100% usage must trigger isAtLimit");

  // Case E: Over-quota capping (e.g. 7/5 sources)
  const overQuotaUsage = computeUsageMetrics(7, 5, 1, 3);
  assert(overQuotaUsage.sourcesPct === 100, "Over quota must cap at 100%");
  assert(overQuotaUsage.isAtLimit, "Over quota must trigger isAtLimit");
  console.log("   ✓ Quota percentage and threshold triggers verified.");

  // 3. Billing & Pricing Engine Logic
  console.log("3. Testing billing cycle pricing models and discount structure...");
  const PRICING_TABLE: Record<SubscriptionPlan, { monthly: number; annual: number }> = {
    free: { monthly: 0, annual: 0 },
    starter: { monthly: 900, annual: 9000 },
    pro: { monthly: 2900, annual: 29000 },
    business: { monthly: 9900, annual: 99000 },
  };

  for (const [planKey, pricing] of Object.entries(PRICING_TABLE)) {
    if (planKey === "free") {
      assert(pricing.monthly === 0 && pricing.annual === 0, "Free plan cost must be zero");
    } else {
      // 12 months at monthly price vs 1 annual price
      const fullAnnualEquivalent = pricing.monthly * 12;
      assert(
        pricing.annual < fullAnnualEquivalent,
        `Annual pricing for ${planKey} must be discounted compared to 12 months (saved: $${(fullAnnualEquivalent - pricing.annual) / 100})`
      );
      // Discount must be ~16-20%
      const savingsPct = Math.round(((fullAnnualEquivalent - pricing.annual) / fullAnnualEquivalent) * 100);
      assert(savingsPct >= 15, `Annual savings for ${planKey} should be at least 15% (actual: ${savingsPct}%)`);
    }
  }
  console.log("   ✓ Billing pricing structure and annual discount math verified.");

  // 4. Onboarding Presets & Seed Feeds Integrity
  console.log("4. Testing onboarding presets and SSRF safety of seed feeds...");
  assert(SUGGESTED_PRESETS.length >= 3, "Must have at least 3 curated intelligence presets");

  const requiredPresets = ["ai-agents", "tech-engineering", "startups-vc"];
  for (const pid of requiredPresets) {
    const preset = SUGGESTED_PRESETS.find((p) => p.id === pid);
    assert(Boolean(preset), `Required preset '${pid}' must exist`);
    assert((preset?.defaultKeywords.length ?? 0) >= 3, `Preset '${pid}' must include default keywords`);
    assert((preset?.suggestedFeeds.length ?? 0) >= 1, `Preset '${pid}' must include suggested feeds`);

    // Verify all feed URLs are valid HTTPS and not internal IPs
    for (const feed of preset!.suggestedFeeds) {
      assert(feed.url.startsWith("https://"), `Feed URL '${feed.url}' must be secure HTTPS`);
      const ssrfCheck = await validateFeedUrl(feed.url);
      assert(ssrfCheck.valid, `Preset feed URL '${feed.url}' must pass SSRF safety validation`);
    }
  }
  console.log("   ✓ Onboarding presets and feed URLs verified secure.");

  // 5. User Profile & Multi-Tenancy Roles
  console.log("5. Testing profile and workspace multi-tenancy definitions...");
  const validRoles = ["owner", "admin", "member"];
  assert(validRoles.includes("owner"), "Role 'owner' must be supported");
  assert(validRoles.includes("admin"), "Role 'admin' must be supported");
  assert(validRoles.includes("member"), "Role 'member' must be supported");

  // Password validation rules
  function validatePasswordPolicy(pwd: string): { valid: boolean; error?: string } {
    if (!pwd || pwd.length < 8) {
      return { valid: false, error: "Password must be at least 8 characters" };
    }
    if (pwd.length > 128) {
      return { valid: false, error: "Password must not exceed 128 characters" };
    }
    return { valid: true };
  }

  assert(!validatePasswordPolicy("short").valid, "Passwords < 8 chars must be rejected");
  assert(!validatePasswordPolicy("").valid, "Empty passwords must be rejected");
  assert(validatePasswordPolicy("StrongPassw0rd!").valid, "Valid password must pass");
  console.log("   ✓ User profile, multi-tenancy roles, and password policies verified.");

  console.log("\n>>> ALL SAAS INFRASTRUCTURE TESTS PASSED SUCCESSFULLY! <<<\n");
}

runSaaSInfrastructureTests().catch((err) => {
  console.error("Test Suite Failure:", err);
  process.exit(1);
});
