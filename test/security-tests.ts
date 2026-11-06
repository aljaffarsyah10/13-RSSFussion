import { isPrivateOrReservedIP, validateFeedUrl } from "../src/lib/rss/ssrf-validator";
import { canonicalizeUrl, stripHtml } from "../src/lib/rss/article-normalizer";
import { PLAN_LIMITS } from "../src/server/services/quota.service";
import { handleApiError } from "../src/server/auth/api-error";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Security Test Failed: ${msg}`);
  }
}

async function runSecurityAudit() {
  console.log("=== RUNNING PHASE 9 COMPREHENSIVE SECURITY & INTEGRITY TESTS ===");

  // 1. SSRF Attack Vector Verification
  console.log("1. Testing SSRF attack vectors and IP evasion...");
  const maliciousUrls = [
    "http://127.0.0.1/admin",
    "http://127.0.0.2:8080/metrics",
    "http://localhost:3000/api",
    "http://169.254.169.254/latest/meta-data/",
    "http://192.168.1.1/router",
    "http://10.0.0.5/internal",
    "http://172.16.0.1/secrets",
    "file:///etc/passwd",
    "ftp://internal.vault/keys",
    "gopher://127.0.0.1:6379/",
    "data:text/html,<script>alert(1)</script>",
    "javascript:alert(document.cookie)",
  ];

  for (const url of maliciousUrls) {
    const res = await validateFeedUrl(url);
    assert(!res.valid, `SSRF vulnerability: Failed to block malicious URL -> ${url}`);
  }
  console.log(`   ✓ Successfully blocked all ${maliciousUrls.length} SSRF attack vectors.`);

  // 2. Private IP Range Classification
  console.log("2. Testing internal & loopback IP classification boundaries...");
  assert(isPrivateOrReservedIP("127.0.0.1"), "Should block 127.0.0.1 loopback");
  assert(isPrivateOrReservedIP("10.254.254.1"), "Should block 10.x.x.x private class A");
  assert(isPrivateOrReservedIP("172.20.10.5"), "Should block 172.16-31.x.x private class B");
  assert(isPrivateOrReservedIP("192.168.1.254"), "Should block 192.168.x.x private class C");
  assert(isPrivateOrReservedIP("169.254.169.254"), "Should block 169.254 link-local cloud metadata");
  assert(isPrivateOrReservedIP("0.0.0.0"), "Should block 0.0.0.0");
  assert(isPrivateOrReservedIP("::1"), "Should block ::1 IPv6 loopback");
  assert(!isPrivateOrReservedIP("8.8.8.8"), "Should allow public Google DNS IP 8.8.8.8");
  assert(!isPrivateOrReservedIP("1.1.1.1"), "Should allow public Cloudflare IP 1.1.1.1");
  console.log("   ✓ All IP classifications and range checks verified.");

  // 3. XSS & HTML Sanitization Verification
  console.log("3. Testing XSS prevention and HTML sanitization in feed content...");
  const dangerousHtml = `
    <h1>Breaking Headline</h1>
    <script>alert("xss")</script>
    <img src="x" onerror="stealCookies()" />
    <p>Legitimate article description with <a href="javascript:alert(1)">malicious link</a>.</p>
  `;
  const sanitized = stripHtml(dangerousHtml);
  assert(!sanitized.includes("<script>"), "Sanitizer must strip <script> tags");
  assert(!sanitized.includes("alert("), "Sanitizer must strip script code");
  assert(!sanitized.includes("onerror"), "Sanitizer must strip event handlers");
  assert(!sanitized.includes("javascript:"), "Sanitizer must strip javascript: URIs");
  assert(sanitized.includes("Breaking Headline"), "Sanitizer must preserve benign readable text");
  console.log("   ✓ HTML sanitization and XSS prevention verified.");

  // 4. Canonical URL Normalization
  console.log("4. Testing URL normalization and tracking param stripping...");
  const canonical = canonicalizeUrl("https://example.com/article?utm_source=twitter&utm_medium=social&fbclid=12345&id=42");
  assert(!canonical.includes("utm_source"), "Tracking param utm_source must be stripped");
  assert(!canonical.includes("fbclid"), "Tracking param fbclid must be stripped");
  assert(canonical.includes("id=42"), "Functional query params must be preserved");
  assert(canonical === "https://example.com/article?id=42", "Canonical URL should match expected");
  console.log("   ✓ Canonical URL normalization verified.");

  // 5. Plan Quotas Verification
  console.log("5. Testing subscription plan quota boundaries...");
  assert(PLAN_LIMITS.free.maxSources === 5, "Free plan limit must be 5 sources");
  assert(PLAN_LIMITS.free.maxKeywords === 3, "Free plan limit must be 3 keywords");
  assert(PLAN_LIMITS.free.maxTopics === 3, "Free plan limit must be 3 topics");
  assert(PLAN_LIMITS.starter.maxSources === 30, "Starter plan limit must be 30 sources");
  assert(PLAN_LIMITS.pro.maxSources === 100, "Pro plan limit must be 100 sources");
  assert(PLAN_LIMITS.business.maxSources === 999999, "Business plan must have unlimited sources");
  console.log("   ✓ Plan quota configurations verified.");

  // 6. Security API Error Handlers
  console.log("6. Testing API security error mapping (HTTP status codes)...");
  const authErrResponse = handleApiError(new Error("UNAUTHORIZED"));
  assert(authErrResponse.status === 401, "UNAUTHORIZED must map to 401 status");

  const notFoundErrResponse = handleApiError(new Error("NOT_FOUND"));
  assert(notFoundErrResponse.status === 404, "NOT_FOUND must map to 404 status");

  const quotaErrResponse = handleApiError(new Error("QUOTA_EXCEEDED: limit reached"));
  assert(quotaErrResponse.status === 403, "QUOTA_EXCEEDED must map to 403 status");

  const ssrfErrResponse = handleApiError(new Error("SSRF_BLOCKED: private ip"));
  assert(ssrfErrResponse.status === 422, "SSRF_BLOCKED must map to 422 status");

  const rateLimitErrResponse = handleApiError(new Error("RATE_LIMITED: wait 60s"));
  assert(rateLimitErrResponse.status === 429, "RATE_LIMITED must map to 429 status");

  const conflictErrResponse = handleApiError(new Error("CONFLICT: feed already exists"));
  assert(conflictErrResponse.status === 409, "CONFLICT must map to 409 status");
  console.log("   ✓ API security error mappings verified.");

  console.log("=== ALL SECURITY & INTEGRITY AUDIT CHECKS PASSED ===");
}

runSecurityAudit().catch((err) => {
  console.error("Security audit error:", err);
  process.exit(1);
});
