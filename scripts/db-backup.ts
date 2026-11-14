import { createDatabaseBackup, listBackups, verifyBackupIntegrity } from "../src/server/services/backup.service";

async function runCliBackup() {
  console.log("==========================================");
  console.log("   RSSFusion Database Backup Utility      ");
  console.log("==========================================");

  console.log("\n[1/3] Triggering full database snapshot...");
  const backup = await createDatabaseBackup();
  console.log(`✓ Backup successfully created: ${backup.backupId}`);
  console.log(`  File: ${backup.fileName}`);
  console.log(`  Size: ${Math.round(backup.sizeBytes / 1024)} KB`);
  console.log(`  Records: ${backup.totalRecords}`);
  console.log(`  SHA-256 Checksum: ${backup.checksumSha256}`);

  console.log("\n[2/3] Performing cryptographic integrity verification...");
  const verification = verifyBackupIntegrity(backup.fileName);
  if (!verification.valid) {
    console.error(`✗ Integrity check failed: ${verification.error}`);
    process.exit(1);
  }
  console.log("✓ Checksum match confirmed. Backup file is valid and uncorrupted.");
  console.log(`  Tables verified: ${verification.tablesVerified.join(", ")}`);

  console.log("\n[3/3] Inspecting backup retention status...");
  const allBackups = listBackups();
  console.log(`✓ Active backups stored locally: ${allBackups.length}`);

  console.log("\n>>> DATABASE BACKUP COMPLETED SAFELY <<<\n");
}

runCliBackup().catch((err) => {
  console.error("Backup fatal error:", err);
  process.exit(1);
});
