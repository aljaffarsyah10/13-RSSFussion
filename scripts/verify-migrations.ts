import fs from "fs";
import path from "path";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "supabase", "migrations");

export interface MigrationFileVerification {
  fileName: string;
  version: string;
  sizeBytes: number;
  tablesCreated: string[];
  indexesCreated: string[];
  policiesCreated: string[];
  isValid: boolean;
}

export function verifyMigrations(): {
  totalMigrations: number;
  allValid: boolean;
  migrations: MigrationFileVerification[];
} {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory not found at ${MIGRATIONS_DIR}`);
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const results: MigrationFileVerification[] = [];

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const content = fs.readFileSync(filePath, "utf8");

    // Extract table names
    const tableMatches = Array.from(content.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi));
    const tablesCreated = tableMatches.map((m) => m[1]);

    // Extract index names
    const indexMatches = Array.from(content.matchAll(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/gi));
    const indexesCreated = indexMatches.map((m) => m[1]);

    // Extract RLS policy names
    const policyMatches = Array.from(content.matchAll(/CREATE\s+POLICY\s+"([^"]+)"/gi));
    const policiesCreated = policyMatches.map((m) => m[1]);

    const isValid = content.length > 50 && (tablesCreated.length > 0 || indexesCreated.length > 0 || policiesCreated.length > 0 || content.includes("ALTER TABLE"));

    results.push({
      fileName: file,
      version: file.split("_")[0],
      sizeBytes: Buffer.byteLength(content, "utf8"),
      tablesCreated,
      indexesCreated,
      policiesCreated,
      isValid,
    });
  }

  const allValid = results.length > 0 && results.every((r) => r.isValid);

  return {
    totalMigrations: results.length,
    allValid,
    migrations: results,
  };
}

async function runCli() {
  console.log("==========================================");
  console.log("   RSSFusion Database Migration Audit     ");
  console.log("==========================================");

  const report = verifyMigrations();
  console.log(`\nFound ${report.totalMigrations} migration files:`);

  for (const m of report.migrations) {
    console.log(`\n• ${m.fileName} (${m.sizeBytes} bytes)`);
    if (m.tablesCreated.length > 0) {
      console.log(`  Tables: ${m.tablesCreated.join(", ")}`);
    }
    if (m.indexesCreated.length > 0) {
      console.log(`  Indexes: ${m.indexesCreated.length} created`);
    }
    if (m.policiesCreated.length > 0) {
      console.log(`  RLS Policies: ${m.policiesCreated.length} configured`);
    }
    console.log(`  Status: ${m.isValid ? "✓ VALID" : "✗ INVALID"}`);
  }

  if (report.allValid) {
    console.log("\n>>> ALL DATABASE MIGRATIONS VERIFIED SUCCESSFULLY <<<\n");
  } else {
    console.error("\n✗ One or more migration files failed verification!\n");
    process.exit(1);
  }
}

if (require.main === module) {
  runCli().catch((err) => {
    console.error("Migration audit failed:", err);
    process.exit(1);
  });
}
