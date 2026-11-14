import { restoreDatabaseBackup, listBackups } from "../src/server/services/backup.service";

async function runCliRestore() {
  console.log("==========================================");
  console.log("  RSSFusion Disaster Recovery & Restore   ");
  console.log("==========================================");

  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const targetFileArg = args.find((a) => !a.startsWith("--"));

  let backupTarget = targetFileArg;

  if (!backupTarget) {
    const existing = listBackups();
    if (existing.length === 0) {
      console.error("✗ No backups found in local storage. Provide a backup path to restore.");
      process.exit(1);
    }
    backupTarget = existing[0].fileName;
    console.log(`> No target specified. Defaulting to newest available backup: ${backupTarget}`);
  }

  console.log(`\n[1/2] Initiating database restore (Dry Run: ${isDryRun ? "YES" : "NO"})...`);
  console.log(`  Target: ${backupTarget}`);

  const result = await restoreDatabaseBackup(backupTarget, { dryRun: isDryRun });

  if (!result.success) {
    console.error(`✗ Restore operation failed: ${result.error}`);
    process.exit(1);
  }

  console.log("\n[2/2] Restoration Summary:");
  console.log(`  Backup ID: ${result.backupId}`);
  console.log(`  Mode: ${result.dryRun ? "DRY RUN (No writes performed)" : "LIVE RESTORE"}`);
  console.log(`  Total Records: ${result.totalRecordsRestored}`);
  console.log("  Table breakdown:");
  for (const [table, count] of Object.entries(result.tablesRestored)) {
    console.log(`    - ${table}: ${count} records`);
  }

  console.log("\n>>> DATABASE RESTORATION PROCEDURE COMPLETED <<<\n");
}

runCliRestore().catch((err) => {
  console.error("Restore fatal error:", err);
  process.exit(1);
});
