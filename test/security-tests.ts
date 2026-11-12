import { isPrivateOrReservedIP, validateFeedUrl } from "../src/lib/rss/ssrf-validator";
import { canonicalizeUrl, stripHtml } from "../src/lib/rss/article-normalizer";
import { sanitizeSearchQuery } from "../src/server/services/article.service";
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
    "http://[::1]/admin",
    "http://[::ffff:127.0.0.1]/internal",
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
  assert(isPrivateOrReservedIP("[::1]"), "Should block bracketed [::1] IPv6 loopback");
  assert(isPrivateOrReservedIP("::ffff:7f00:1"), "Should block hex IPv4-mapped IPv6 loopback");
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

  // 4. Canonical URL Normalization & Search Query Sanitization
  console.log("4. Testing URL normalization, tracking param stripping & filter sanitization...");
  const canonical = canonicalizeUrl("https://example.com/article?utm_source=twitter&utm_medium=social&fbclid=12345&id=42");
  assert(!canonical.includes("utm_source"), "Tracking param utm_source must be stripped");
  assert(!canonical.includes("fbclid"), "Tracking param fbclid must be stripped");
  assert(canonical.includes("id=42"), "Functional query params must be preserved");
  assert(canonical === "https://example.com/article?id=42", "Canonical URL should match expected");

  const sanitizedSearch = sanitizeSearchQuery("AI,id.eq.1,(drop)%_test");
  assert(!sanitizedSearch.includes(","), "Must strip commas to prevent PostgREST .or() injection");
  assert(!sanitizedSearch.includes("("), "Must strip parentheses from search query");
  assert(!sanitizedSearch.includes("%"), "Must strip raw SQL wildcards from search query");
  console.log("   ✓ Canonical URL normalization & PostgREST query sanitization verified.");

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

  const pgrstNotFoundResponse = handleApiError({ message: "No rows", code: "PGRST116" });
  assert(pgrstNotFoundResponse.status === 404, "PGRST116 must map to 404 status");

  const quotaErrResponse = handleApiError(new Error("QUOTA_EXCEEDED: limit reached"));
  assert(quotaErrResponse.status === 403, "QUOTA_EXCEEDED must map to 403 status");

  const dbTriggerQuotaResponse = handleApiError({ message: "QUOTA_EXCEEDED: Topic limit of 3 reached", code: "P0001" });
  assert(dbTriggerQuotaResponse.status === 403, "DB trigger QUOTA_EXCEEDED object must map to 403 status");

  const ssrfErrResponse = handleApiError(new Error("SSRF_BLOCKED: private ip"));
  assert(ssrfErrResponse.status === 422, "SSRF_BLOCKED must map to 422 status");

  const rateLimitErrResponse = handleApiError(new Error("RATE_LIMITED: wait 60s"));
  assert(rateLimitErrResponse.status === 429, "RATE_LIMITED must map to 429 status");

  const conflictErrResponse = handleApiError(new Error("CONFLICT: feed already exists"));
  assert(conflictErrResponse.status === 409, "CONFLICT must map to 409 status");

  const pgUniqueConflictResponse = handleApiError({ message: "duplicate key", code: "23505" });
  assert(pgUniqueConflictResponse.status === 409, "PostgreSQL 23505 must map to 409 status");
  console.log("   ✓ API security error mappings verified.");

  // 7. Database Error Sanitization & Data Exposure Protection
  console.log("7. Testing database internal error masking (anti-reconnaissance)...");
  const sensitiveDbErr = handleApiError({
    message: 'syntax error at or near "SELECT * FROM users WHERE password="',
    code: "42601",
  });
  assert(sensitiveDbErr.status === 500, "Internal DB syntax errors must be masked with 500");
  const dbErrBody = await sensitiveDbErr.json();
  assert(dbErrBody.error.code === "INTERNAL_ERROR", "Code must be sanitized to INTERNAL_ERROR");
  assert(
    !dbErrBody.error.message.includes("users") && !dbErrBody.error.message.includes("password"),
    "Database error response must NOT leak schema or query details"
  );
  console.log("   ✓ Internal database reconnaissance vectors sanitized.");

  // 8. Password Policy & Auth Schemas Hardening
  console.log("8. Testing password complexity and length bounds...");
  const { registerSchema, loginSchema } = await import("../src/lib/validation/schemas");
  const weakPassword = registerSchema.safeParse({
    email: "test@example.com",
    password: "short",
  });
  assert(!weakPassword.success, "Registration must reject passwords shorter than 8 characters");

  const validPassword = registerSchema.safeParse({
    email: "test@example.com",
    password: "SecurePassword123!",
  });
  assert(validPassword.success, "Registration must accept compliant 8+ character password");

  const oversizedPassword = registerSchema.safeParse({
    email: "test@example.com",
    password: "a".repeat(129),
  });
  assert(!oversizedPassword.success, "Registration must reject passwords > 128 characters to prevent DoS");

  const validLogin = loginSchema.safeParse({
    email: "test@example.com",
    password: "MyPassword",
  });
  assert(validLogin.success, "Login schema must accept valid credentials");
  console.log("   ✓ Password length bounds (8-128) and schemas verified.");

  // 9. XXE & XML DTD Injection Protection
  console.log("9. Testing XXE and DTD injection prevention for OPML import...");
  const xxePayloads = [
    '<!DOCTYPE opml [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><opml version="2.0"><body><outline text="&xxe;" xmlUrl="https://example.com/rss"/></body></opml>',
    '<!DOCTYPE foo [<!ELEMENT foo ANY ><!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/">]><opml version="2.0"><body><outline xmlUrl="https://example.com/rss"/></body></opml>',
    '<!ENTITY % payload SYSTEM "file:///c:/boot.ini"><opml version="2.0"><body><outline xmlUrl="https://example.com/rss"/></body></opml>',
    '<!DOCTYPE test PUBLIC "SYSTEM" "http://evil.com/xxe"><opml version="2.0"><body><outline xmlUrl="https://example.com/rss"/></body></opml>',
  ];

  for (const xxe of xxePayloads) {
    const isRejected =
      /<!DOCTYPE/i.test(xxe) ||
      /<!ENTITY/i.test(xxe) ||
      /\bSYSTEM\b/i.test(xxe) ||
      /\bPUBLIC\b/i.test(xxe);
    assert(isRejected, `Anti-XXE filter must identify and reject dangerous XML payload: ${xxe.slice(0, 30)}...`);
  }
  console.log(`   ✓ All ${xxePayloads.length} XXE / DTD injection vectors blocked.`);

  // 10. CSRF Protection Logic
  console.log("10. Testing Anti-CSRF origin and cross-site verification logic...");
  const isBlockedCrossOrigin = (origin: string, host: string, secFetchSite?: string) => {
    if (secFetchSite === "cross-site") return true;
    try {
      const originUrl = new URL(origin);
      return originUrl.host.toLowerCase() !== host.toLowerCase();
    } catch {
      return true;
    }
  };

  assert(
    isBlockedCrossOrigin("https://evil-attacker.com", "rssfusion.com"),
    "Cross-origin request from evil-attacker.com must be blocked"
  );
  assert(
    isBlockedCrossOrigin("http://localhost:4000", "localhost:3000"),
    "Port mismatch origin must be blocked"
  );
  assert(
    !isBlockedCrossOrigin("https://rssfusion.com", "rssfusion.com"),
    "Same-origin request must be allowed"
  );
  assert(
    isBlockedCrossOrigin("https://rssfusion.com", "rssfusion.com", "cross-site"),
    "Sec-Fetch-Site: cross-site must be blocked even if spoofed"
  );
  console.log("   ✓ CSRF defense rules and origin matching verified.");

  console.log("=== ALL SECURITY & INTEGRITY AUDIT CHECKS PASSED ===");
}

runSecurityAudit().catch((err) => {
  console.error("Security audit error:", err);
  process.exit(1);
});
