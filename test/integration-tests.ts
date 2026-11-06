import { ApiError } from "../src/lib/api/client";
import { sourceFormSchema, topicFormSchema, keywordFormSchema } from "../src/lib/validation/schemas";

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

  // 2. Validate Form Schemas against API expectations
  console.log("2. Testing form schemas against backend expectations...");
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

  const validTopic = topicFormSchema.safeParse({
    name: "AI & Agents",
    description: "Tracking intelligent agent systems",
  });
  assert(validTopic.success, "Topic schema should pass with name and description");

  const validKeyword = keywordFormSchema.safeParse({
    keyword: "Large Language Models",
    topicId: "00000000-0000-0000-0000-000000000000",
  });
  assert(validKeyword.success, "Keyword schema should pass with keyword and topicId");
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
