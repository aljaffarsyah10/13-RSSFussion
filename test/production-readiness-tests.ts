import crypto from "crypto";
import { validateEnv } from "../src/lib/env";
import manifest from "../src/app/manifest";
import sitemap from "../src/app/sitemap";
import robots from "../src/app/robots";
import { verifyMigrations } from "../scripts/verify-migrations";
import {
  verifyBackupIntegrity,
  restoreDatabaseBackup,
  BackupManifest,
} from "../src/server/services/backup.service";
import nextConfig from "../next.config";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Production Readiness Test Failed: ${msg}`);
  }
}

async function runProductionReadinessTests() {
  console.log("=== RUNNING PRODUCTION READINESS, SEO & BACKUP TESTS ===");

  // 1. Environment Configuration Validation
  console.log("1. Testing environment configuration schema and validation...");
  const envTest = validateEnv();
  assert(Boolean(envTest.config), "Environment config must be parsed");
  assert(typeof envTest.config.PORT === "number", "PORT must default to number");
  assert(envTest.config.BACKUP_RETENTION_COUNT >= 1, "Backup retention must be at least 1");
  console.log("   ✓ Environment validation logic verified.");

  // 2. SEO, Web App Manifest & Robots Directives
  console.log("2. Testing SEO metadata, Web App Manifest, Sitemap, and Robots...");
  const appManifest = manifest();
  assert(appManifest.name === "RSSFusion — Information Intelligence Platform", "Manifest name must match");
  assert(appManifest.short_name === "RSSFusion", "Manifest short_name must match");
  assert(appManifest.display === "standalone", "PWA display mode must be standalone");
  assert(Boolean(appManifest.icons && appManifest.icons.length > 0), "Manifest must define icons");

  const siteMapEntries = sitemap();
  assert(siteMapEntries.length >= 4, "Sitemap must include all public routes");
  const urls = siteMapEntries.map((e) => e.url);
  assert(urls.some((u) => u.includes("/pricing")), "Sitemap must include /pricing");

  const robotsRules = robots();
  assert(Boolean(robotsRules.rules), "Robots rules must be defined");
  const defaultRule = Array.isArray(robotsRules.rules) ? robotsRules.rules[0] : robotsRules.rules;
  const disallowed = Array.isArray(defaultRule?.disallow) ? defaultRule.disallow : [defaultRule?.disallow];
  assert(disallowed.some((d) => d?.includes("/dashboard")), "Robots must disallow dashboard crawling");
  console.log("   ✓ SEO, Manifest, Sitemap, and Robots directives verified.");

  // 3. Database Migrations Audit
  console.log("3. Testing database migrations coverage and schema integrity...");
  const migrationReport = verifyMigrations();
  assert(migrationReport.allValid, "All migration files must be valid SQL");
  assert(migrationReport.totalMigrations >= 5, "Must have at least 5 chronological migrations");

  const allTables = migrationReport.migrations.flatMap((m) => m.tablesCreated);
  const requiredTables = ["profiles", "rss_sources", "articles", "topics", "keywords", "subscriptions", "billing_invoices"];
  for (const table of requiredTables) {
    assert(allTables.includes(table), `Required table '${table}' must be created in migrations`);
  }
  console.log("   ✓ Database migrations schema and table coverage verified.");

  // 4. Database Backup & Restoration Lifecycle
  console.log("4. Testing database backup verification and dry-run restoration...");
  const sampleTables = {
    profiles: [{ id: "usr_100", full_name: "Production Admin", role: "admin" }],
    rss_sources: [{ id: "src_100", name: "TechCrunch", feed_url: "https://techcrunch.com/feed/" }],
    subscriptions: [{ id: "sub_100", user_id: "usr_100", plan: "pro", status: "active" }],
  };

  const payloadJson = JSON.stringify(sampleTables);
  const checksum = crypto.createHash("sha256").update(payloadJson).digest("hex");

  const validManifest: BackupManifest = {
    backupId: "backup_prod_test_001",
    version: "1.0",
    createdAt: new Date().toISOString(),
    tableCounts: { profiles: 1, rss_sources: 1, subscriptions: 1 },
    totalRecords: 3,
    checksumSha256: checksum,
    sizeBytes: Buffer.byteLength(payloadJson),
    fileName: "backup_prod_test_001.json",
    tables: sampleTables,
  };

  // Test dry-run restoration on valid backup
  const restoreDryRun = await restoreDatabaseBackup(validManifest, { dryRun: true });
  assert(restoreDryRun.success, "Dry run restore on valid backup must succeed");
  assert(restoreDryRun.dryRun === true, "dryRun flag must be true");
  assert(restoreDryRun.totalRecordsRestored === 3, "Dry run should report all 3 records parsed");
  assert(restoreDryRun.tablesRestored.profiles === 1, "Profiles table records parsed");

  // Test corrupted backup rejection
  const corruptedManifest: BackupManifest = {
    ...validManifest,
    checksumSha256: "corrupted_checksum_value",
  };
  const corruptedRestore = await restoreDatabaseBackup(corruptedManifest, { dryRun: true });
  assert(!corruptedRestore.success, "Restore must abort on corrupted backup");
  assert(Boolean(corruptedRestore.error?.includes("integrity check failed")), "Error must state integrity failure");
  console.log("   ✓ Backup verification and dry-run restoration verified.");

  // 5. Next.js Security Headers
  console.log("5. Testing Next.js production security headers...");
  if (typeof nextConfig.headers === "function") {
    const headersList = await nextConfig.headers();
    const globalHeader = headersList.find((h) => h.source === "/(.*)");
    assert(Boolean(globalHeader), "Global security headers must be configured for /(.*)");

    const headerKeys = globalHeader!.headers.map((h) => h.key);
    assert(headerKeys.includes("X-Content-Type-Options"), "Must include X-Content-Type-Options");
    assert(headerKeys.includes("X-Frame-Options"), "Must include X-Frame-Options");
    assert(headerKeys.includes("Strict-Transport-Security"), "Must include Strict-Transport-Security");
    assert(headerKeys.includes("Referrer-Policy"), "Must include Referrer-Policy");
  }
  console.log("   ✓ Security response headers verified.");

  console.log("\n>>> ALL PRODUCTION READINESS CHECKS PASSED SUCCESSFULLY! <<<\n");
}

runProductionReadinessTests().catch((err) => {
  console.error("Test Suite Failure:", err);
  process.exit(1);
});
