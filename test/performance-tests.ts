import { cache } from "../src/lib/cache/cache-manager";
import * as fs from "fs";
import * as path from "path";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Performance Test Failed: ${msg}`);
  }
}

async function runPerformanceTests() {
  console.log("=== RUNNING PERFORMANCE, CACHING & SCALABILITY TESTS ===");

  // 1. Cache Manager Basic Get/Set & Expiry
  console.log("1. Testing CacheManager get, set, and TTL expiration...");
  await cache.set("test_key", { data: "perf_value" }, 1); // 1 sec TTL
  const cachedVal = await cache.get<{ data: string }>("test_key");
  assert(cachedVal !== null && cachedVal.data === "perf_value", "CacheManager must retrieve stored value");

  // Wait 1.1s for expiration
  await new Promise((r) => setTimeout(r, 1100));
  const expiredVal = await cache.get("test_key");
  assert(expiredVal === null, "CacheManager must return null for expired key");
  console.log("   ✓ Cache get, set, and TTL expiration verified.");

  // 2. CacheManager remember() Pattern
  console.log("2. Testing CacheManager remember() memoization...");
  let executionCount = 0;
  const fetcher = async () => {
    executionCount++;
    return { count: executionCount, timestamp: Date.now() };
  };

  const res1 = await cache.remember("memo_key", 10, fetcher);
  assert(res1.count === 1, "First remember() call must execute fetcher");

  const res2 = await cache.remember("memo_key", 10, fetcher);
  assert(res2.count === 1, "Second remember() call must return cached result without re-executing fetcher");
  assert(executionCount === 1, "Fetcher should only have executed once");
  console.log("   ✓ remember() memoization successfully prevented redundant compute.");

  // 3. Cache Invalidation (del and delPattern)
  console.log("3. Testing CacheManager manual and pattern invalidation...");
  await cache.set("user_stat:123", { val: 1 }, 60);
  await cache.set("user_stat:456", { val: 2 }, 60);
  await cache.del("user_stat:123");
  assert((await cache.get("user_stat:123")) === null, "Manual key deletion must remove entry");
  assert((await cache.get("user_stat:456")) !== null, "Unrelated key must remain");

  await cache.delPattern("user_stat:*");
  assert((await cache.get("user_stat:456")) === null, "Pattern deletion must clear matching keys");
  console.log("   ✓ Manual and pattern invalidation verified.");

  // 4. Database Indexing Migration Verification
  console.log("4. Verifying Performance Migration 20261113000003 indexing coverage...");
  const migrationPath = path.resolve(
    __dirname,
    "../supabase/migrations/20261113000003_performance_and_scalability_indexes.sql"
  );
  assert(fs.existsSync(migrationPath), "Performance index migration file must exist");
  const migrationSql = fs.readFileSync(migrationPath, "utf8");

  assert(migrationSql.includes("pg_trgm"), "Migration must enable pg_trgm extension");
  assert(migrationSql.includes("idx_articles_trgm_title_desc"), "Migration must create Trigram GIN index for search");
  assert(migrationSql.includes("idx_articles_fetched_at_desc"), "Migration must index articles(fetched_at DESC)");
  assert(migrationSql.includes("idx_rss_sources_user_enabled"), "Migration must index rss_sources(user_id, enabled)");
  assert(migrationSql.includes("idx_read_user_article_composite"), "Migration must index read status composite");
  assert(migrationSql.includes("idx_saved_user_article_composite"), "Migration must index saved articles composite");
  console.log("   ✓ All required performance and scalability indexes verified in SQL migration.");

  // 5. Next.js Config Package Import Optimization
  console.log("5. Verifying next.config.ts package optimization...");
  const nextConfigPath = path.resolve(__dirname, "../next.config.ts");
  const nextConfigContent = fs.readFileSync(nextConfigPath, "utf8");
  assert(
    nextConfigContent.includes("optimizePackageImports"),
    "next.config.ts must optimize icon package imports to reduce bundle size"
  );
  console.log("   ✓ Package import optimizations verified.");

  console.log("=== ALL PERFORMANCE & SCALABILITY TESTS PASSED ===");
}

runPerformanceTests().catch((err) => {
  console.error("Performance test error:", err);
  process.exit(1);
});
