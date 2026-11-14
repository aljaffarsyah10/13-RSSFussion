import crypto from "crypto";
import { Logger, sanitizeLogData } from "../src/lib/observability/logger";
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  RateLimitError,
  QuotaExceededError,
  DatabaseError,
} from "../src/lib/errors/app-error";
import { errorTracker } from "../src/lib/observability/error-tracker";
import { metrics } from "../src/lib/observability/metrics";
import { checkMemoryHealth } from "../src/server/services/health.service";
import { verifyBackupIntegrity, BackupManifest } from "../src/server/services/backup.service";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Observability Test Failed: ${msg}`);
  }
}

async function runObservabilityTests() {
  console.log("=== RUNNING LOGGING, ERROR TRACKING, MONITORING & BACKUP TESTS ===");

  // 1. Structured Logging & Sensitive Data Redaction
  console.log("1. Testing structured logging and credential sanitization...");
  const rawPayload = {
    username: "john_doe",
    password: "SuperSecretPassword123!",
    api_key: "sk-live-abcdef123456",
    nested: {
      authToken: "bearer-token-value",
      safeValue: 42,
    },
    authorization: "Bearer eyJhbGciOi...",
  };

  const sanitized = sanitizeLogData(rawPayload) as Record<string, unknown>;
  assert(sanitized.username === "john_doe", "Non-sensitive fields must remain intact");
  assert(sanitized.password === "[REDACTED]", "Password field must be redacted");
  assert(sanitized.api_key === "[REDACTED]", "API key field must be redacted");
  assert(sanitized.authorization === "[REDACTED]", "Authorization header must be redacted");

  const nested = sanitized.nested as Record<string, unknown>;
  assert(nested.authToken === "[REDACTED]", "Nested auth token must be redacted");
  assert(nested.safeValue === 42, "Nested safe values must remain intact");

  const testLogger = new Logger({ service: "test-service", minLevel: "debug" });
  const timer = testLogger.startTimer("testAction", { userId: "user-123" });
  assert(Boolean(timer.traceId), "Timer must issue a valid traceId");
  const elapsedMs = timer.done("Finished action");
  assert(elapsedMs >= 0, "Elapsed milliseconds must be non-negative");
  console.log("   ✓ Structured logger and security redaction verified.");

  // 2. Standardized AppError Class Hierarchy
  console.log("2. Testing AppError class hierarchy and status mappings...");
  const notFound = new NotFoundError("Article not found", "articles");
  assert(notFound.statusCode === 404, "NotFoundError status must be 404");
  assert(notFound.code === "NOT_FOUND", "NotFoundError code must be NOT_FOUND");

  const unauth = new UnauthorizedError("Session expired");
  assert(unauth.statusCode === 401, "UnauthorizedError status must be 401");

  const forbidden = new ForbiddenError("Insufficient permissions");
  assert(forbidden.statusCode === 403, "ForbiddenError status must be 403");

  const validation = new ValidationError("Invalid inputs", { email: "Invalid format" });
  assert(validation.statusCode === 400, "ValidationError status must be 400");
  assert(validation.details?.fields?.email === "Invalid format", "Field errors must be preserved");

  const rateLimit = new RateLimitError("Rate limit reached", 60);
  assert(rateLimit.statusCode === 429, "RateLimitError status must be 429");
  assert(rateLimit.details?.retryAfterSeconds === 60, "Retry-After must be preserved");

  const quota = new QuotaExceededError("Quota exceeded on free tier");
  assert(quota.statusCode === 403, "QuotaExceededError status must be 403");

  const dbErr = new DatabaseError("Query timed out");
  assert(dbErr.statusCode === 500, "DatabaseError status must be 500");
  console.log("   ✓ AppError subclasses and status codes verified.");

  // 3. Error Tracking & Deduplication Ring Buffer
  console.log("3. Testing error tracker deduplication and ring buffer...");
  errorTracker.clear();

  const err1 = new Error("Database connection refused");
  const report1 = errorTracker.captureException(err1, { route: "/api/sources", statusCode: 500 });
  assert(report1.count === 1, "First occurrence should have count 1");
  assert(Boolean(report1.fingerprint), "Report must generate fingerprint");

  // Same error repeated
  const report2 = errorTracker.captureException(err1, { route: "/api/sources", statusCode: 500 });
  assert(report2.count === 2, "Identical error must increment count via fingerprint");
  assert(report2.fingerprint === report1.fingerprint, "Fingerprints must match");

  const stats = errorTracker.getStats();
  assert(stats.totalCaptured === 2, "Total captured count must reflect occurrences");
  assert(stats.uniqueErrors === 1, "Unique errors count must be deduplicated to 1");

  const recent = errorTracker.getRecentErrors();
  assert(recent.length === 1, "Recent errors list should return the captured record");
  console.log("   ✓ Error tracker deduplication and statistics verified.");

  // 4. Metrics Registry & Prometheus Export
  console.log("4. Testing metrics registry, histograms and Prometheus export...");
  metrics.reset();

  metrics.increment("http_requests_total", 1, { method: "GET", path: "/api/sources" });
  metrics.increment("http_requests_total", 2, { method: "GET", path: "/api/sources" });
  metrics.increment("http_errors_total", 1, { code: "NOT_FOUND" });

  metrics.recordDuration("http_request_duration_ms", 45);
  metrics.recordDuration("http_request_duration_ms", 120);
  metrics.recordDuration("http_request_duration_ms", 75);

  const durationSummary = metrics.getSummary("http_request_duration_ms");
  assert(durationSummary.count === 3, "Duration count must be 3");
  assert(durationSummary.min === 45, "Min latency must be 45");
  assert(durationSummary.max === 120, "Max latency must be 120");
  assert(durationSummary.avg === 80, "Avg latency must be 80");

  const prometheus = metrics.getPrometheusMetrics();
  assert(prometheus.includes("process_uptime_seconds"), "Prometheus must include uptime gauge");
  assert(prometheus.includes("nodejs_heap_used_bytes"), "Prometheus must include memory gauge");
  assert(prometheus.includes("http_requests_total"), "Prometheus must include request counter");
  assert(prometheus.includes("http_request_duration_ms_avg_ms"), "Prometheus must include duration summary");
  console.log("   ✓ Metrics registry and Prometheus output verified.");

  // 5. Memory Health Check Assessment
  console.log("5. Testing memory health checks and bounds...");
  const memHealth = checkMemoryHealth();
  assert(memHealth.status === "healthy" || memHealth.status === "degraded", "Status must be valid HealthStatus");
  assert(Boolean(memHealth.details), "Memory details must be present");
  console.log("   ✓ Memory health checks verified.");

  // 6. Database Backup & Cryptographic Integrity Verification
  console.log("6. Testing database backup manifest & SHA-256 integrity verification...");
  const mockTables = {
    profiles: [{ id: "u-1", full_name: "Test User" }],
    rss_sources: [{ id: "src-1", name: "Hacker News", feed_url: "https://news.ycombinator.com/rss" }],
  };

  const payloadJson = JSON.stringify(mockTables);
  const correctChecksum = crypto.createHash("sha256").update(payloadJson).digest("hex");

  const validManifest: BackupManifest = {
    backupId: "backup_test_12345",
    version: "1.0",
    createdAt: new Date().toISOString(),
    tableCounts: { profiles: 1, rss_sources: 1 },
    totalRecords: 2,
    checksumSha256: correctChecksum,
    sizeBytes: Buffer.byteLength(payloadJson),
    fileName: "backup_test_12345.json",
    tables: mockTables,
  };

  // Test Valid Manifest
  const validVerification = verifyBackupIntegrity(validManifest);
  assert(validVerification.valid, "Valid manifest must pass integrity verification");
  assert(validVerification.checksumMatches, "Checksum must match");
  assert(validVerification.tablesVerified.includes("profiles"), "Profiles table verified");

  // Test Corrupted / Tampered Manifest
  const tamperedManifest: BackupManifest = {
    ...validManifest,
    checksumSha256: "0000000000000000000000000000000000000000000000000000000000000000",
  };
  const tamperedVerification = verifyBackupIntegrity(tamperedManifest);
  assert(!tamperedVerification.valid, "Tampered checksum must be rejected");
  assert(!tamperedVerification.checksumMatches, "Tampered checksum must be flagged");
  console.log("   ✓ Backup cryptographic integrity and anti-tampering verified.");

  console.log("\n>>> ALL OBSERVABILITY, HEALTH CHECK & BACKUP TESTS PASSED! <<<\n");
}

runObservabilityTests().catch((err) => {
  console.error("Test Suite Failure:", err);
  process.exit(1);
});
