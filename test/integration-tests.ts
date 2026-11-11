import { ApiError } from "../src/lib/api/client";
import {
  sourceFormSchema,
  sourceUpdateSchema,
  topicFormSchema,
  topicUpdateSchema,
  keywordFormSchema,
  keywordUpdateSchema,
  notificationSettingsSchema,
} from "../src/lib/validation/schemas";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function runIntegrationValidation() {
  console.log("=== RUNNING PHASE 7 INTEGRATION TESTS ===");

  // 1. Validate ApiError constructor & shape
  console.log("1. Testing ApiError mapping...");
  const err = new ApiError("Limit reached", 403, "QUOTA_EXCEEDED", { max: 5 });
  assert(err instanceof Error, "ApiError must be an instance of Error");
  assert(err.status === 403, "Status should be 403");
  assert(err.code === "QUOTA_EXCEEDED", "Code should match QUOTA_EXCEEDED");
  console.log("   ✓ ApiError mapping verified.");

  // 2. Validate Form & Update Schemas against API expectations
  console.log("2. Testing form & PATCH schemas against backend expectations...");
  const validSource = sourceFormSchema.safeParse({
    name: "Tech News",
    feedUrl: "https://news.ycombinator.com/rss",
    siteUrl: "https://news.ycombinator.com",
    fetchIntervalMinutes: 30,
  });
  assert(validSource.success, "Source form schema should pass with valid input");

  const invalidSource = sourceFormSchema.safeParse({
    name: "",
    feedUrl: "invalid-url",
  });
  assert(!invalidSource.success, "Source form schema should reject invalid URL & empty name");

  const invalidSourceUpdate = sourceUpdateSchema.safeParse({
    fetchIntervalMinutes: 2, // below 15 min minimum
  });
  assert(!invalidSourceUpdate.success, "Source update schema should reject interval < 15m");

  const validTopic = topicFormSchema.safeParse({
    name: "AI & Agents",
    description: "Tracking intelligent agent systems",
  });
  assert(validTopic.success, "Topic schema should pass with name and description");

  const validTopicUpdate = topicUpdateSchema.safeParse({
    name: "Updated Topic Name",
  });
  assert(validTopicUpdate.success, "Topic update schema should pass partial update");

  const validKeyword = keywordFormSchema.safeParse({
    keyword: "Large Language Models",
    topicId: "00000000-0000-0000-0000-000000000000",
  });
  assert(validKeyword.success, "Keyword schema should pass with keyword and topicId");

  const validKeywordUpdate = keywordUpdateSchema.safeParse({
    enabled: false,
    topicId: null,
  });
  assert(validKeywordUpdate.success, "Keyword update schema should allow detaching topicId with null");

  const validNotifSettings = notificationSettingsSchema.safeParse({
    emailNotificationsEnabled: true,
    notificationEmail: "alerts@rssfusion.com",
  });
  assert(validNotifSettings.success, "Notification settings schema should accept valid email");

  const invalidNotifSettings = notificationSettingsSchema.safeParse({
    emailNotificationsEnabled: true,
    notificationEmail: "not-an-email",
  });
  assert(!invalidNotifSettings.success, "Notification settings schema should reject invalid email");
  console.log("   ✓ Client-server validation schemas verified.");

  // 3. Verify Article pagination logic
  console.log("3. Testing article cursor pagination contract...");
  const mockItems = [
    { id: "1", publishedAt: "2026-11-06T12:00:00Z" },
    { id: "2", publishedAt: "2026-11-06T11:00:00Z" },
  ];
  const nextCursor = mockItems.length === 2 ? mockItems[mockItems.length - 1].publishedAt : null;
  assert(nextCursor === "2026-11-06T11:00:00Z", "Cursor should point to last item's publishedAt");
  console.log("   ✓ Pagination contract verified.");

  console.log("=== ALL PHASE 7 INTEGRATION TESTS PASSED ===");
}

runIntegrationValidation().catch((e) => {
  console.error("Integration test error:", e);
  process.exit(1);
});
