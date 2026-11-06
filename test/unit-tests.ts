import assert from "node:assert";
import { isPrivateOrReservedIP, validateFeedUrl } from "../src/lib/rss/ssrf-validator";
import { canonicalizeUrl, stripHtml, generateFallbackGuid } from "../src/lib/rss/article-normalizer";
import { matchKeywordsInText } from "../src/lib/rss/keyword-matcher";

async function runUnitTests() {
  console.log("=== RUNNING PHASE 6 UNIT TESTS ===");

  // 1. SSRF Tests: IP classification
  console.log("1. Testing SSRF IP validation...");
  assert.strictEqual(isPrivateOrReservedIP("127.0.0.1"), true, "Should block loopback IPv4");
  assert.strictEqual(isPrivateOrReservedIP("10.0.1.20"), true, "Should block 10.x private IPv4");
  assert.strictEqual(isPrivateOrReservedIP("192.168.1.1"), true, "Should block 192.168.x private IPv4");
  assert.strictEqual(isPrivateOrReservedIP("172.16.0.5"), true, "Should block 172.16.x private IPv4");
  assert.strictEqual(isPrivateOrReservedIP("169.254.169.254"), true, "Should block AWS metadata IP");
  assert.strictEqual(isPrivateOrReservedIP("::1"), true, "Should block loopback IPv6");
  assert.strictEqual(isPrivateOrReservedIP("::ffff:127.0.0.1"), true, "Should block IPv4-mapped IPv6 loopback");
  assert.strictEqual(isPrivateOrReservedIP("8.8.8.8"), false, "Should allow public Google DNS");
  assert.strictEqual(isPrivateOrReservedIP("104.21.5.10"), false, "Should allow public Cloudflare IP");
  console.log("   ✓ SSRF IP classification passed.");

  // 2. SSRF Tests: URL schemes and ports
  console.log("2. Testing SSRF URL checks...");
  const fileCheck = await validateFeedUrl("file:///etc/passwd");
  assert.strictEqual(fileCheck.valid, false, "Should reject file:// scheme");

  const portCheck = await validateFeedUrl("http://example.com:22/rss");
  assert.strictEqual(portCheck.valid, false, "Should reject non-standard port 22");

  const credCheck = await validateFeedUrl("http://admin:pass@example.com/rss");
  assert.strictEqual(credCheck.valid, false, "Should reject embedded credentials");

  const localCheck = await validateFeedUrl("http://localhost:3000/feed");
  assert.strictEqual(localCheck.valid, false, "Should reject localhost hostname");
  console.log("   ✓ SSRF URL checks passed.");

  // 3. Article Normalization Tests
  console.log("3. Testing Article URL canonicalization & HTML stripping...");
  const rawUrl = "https://example.com/blog/post-1/?utm_source=rss&utm_medium=feed&ref=newsletter#comments";
  const canonical = canonicalizeUrl(rawUrl);
  assert.strictEqual(
    canonical,
    "https://example.com/blog/post-1",
    "Should strip utm_ parameters and fragments"
  );

  const rawHtml = "<p>This is <b>bold</b> and has a <script>alert('xss')</script> tag &amp; &quot;quotes&quot;.</p>";
  const cleanText = stripHtml(rawHtml);
  assert.strictEqual(
    cleanText,
    'This is bold and has a tag & "quotes".',
    "Should strip HTML tags and script elements"
  );

  const guid1 = generateFallbackGuid("src-1", "https://example.com/1", "Title A", "2026-11-06");
  const guid2 = generateFallbackGuid("src-1", "https://example.com/1", "Title A", "2026-11-06");
  const guid3 = generateFallbackGuid("src-2", "https://example.com/1", "Title A", "2026-11-06");
  assert.strictEqual(guid1, guid2, "Deterministic fallback GUID must match for identical input");
  assert.notStrictEqual(guid1, guid3, "Fallback GUID must differ across sources");
  console.log("   ✓ Article Normalization passed.");

  // 4. Keyword Matching Tests
  console.log("4. Testing Exact-Phrase Keyword Matching...");
  const textSample = "Anthropic released their new Agentic AI architecture with native Supabase integration.";
  const keywordsList = [
    { id: "kw-1", keyword: "Agentic AI" },
    { id: "kw-2", keyword: "Supabase" },
    { id: "kw-3", keyword: "Next.js" },
    { id: "kw-4", keyword: "agent" }, // boundary test: "agent" shouldn't match "agentic"
  ];
  const matched = matchKeywordsInText(textSample, keywordsList);
  assert.deepStrictEqual(matched.sort(), ["kw-1", "kw-2"].sort(), "Should match Agentic AI and Supabase but not Next.js or agent");
  console.log("   ✓ Keyword Matching passed.");

  console.log("=== ALL UNIT TESTS PASSED SUCCESSFULLY ===");
}

runUnitTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
