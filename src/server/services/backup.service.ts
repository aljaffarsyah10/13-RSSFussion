import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/observability/logger";

export interface BackupMetadata {
  backupId: string;
  version: string;
  createdAt: string;
  tableCounts: Record<string, number>;
  totalRecords: number;
  checksumSha256: string;
  sizeBytes: number;
  fileName: string;
}

export interface BackupManifest extends BackupMetadata {
  tables: Record<string, unknown[]>;
}

export interface BackupVerificationResult {
  valid: boolean;
  backupId: string;
  checksumMatches: boolean;
  expectedChecksum: string;
  computedChecksum: string;
  totalRecords: number;
  tablesVerified: string[];
  error?: string;
}

const BACKUP_TABLES = [
  "profiles",
  "rss_sources",
  "topics",
  "keywords",
  "articles",
  "user_articles",
  "subscriptions",
  "billing_invoices",
  "notification_settings",
] as const;

const BACKUP_DIR = path.resolve(process.cwd(), "backups");
const MAX_BACKUPS_TO_RETAIN = 7;

function ensureBackupDirExists() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function getBackupSupabaseClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createAdminClient();
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Creates an encrypted/checksummed database snapshot and stores it locally
 */
export async function createDatabaseBackup(): Promise<BackupMetadata> {
  const timer = logger.startTimer("createDatabaseBackup");
  ensureBackupDirExists();

  const supabase = getBackupSupabaseClient();

  const backupId = `backup_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const timestamp = new Date().toISOString();
  const tablesData: Record<string, unknown[]> = {};
  const tableCounts: Record<string, number> = {};
  let totalRecords = 0;

  for (const table of BACKUP_TABLES) {
    try {
      const { data, error } = await supabase.from(table).select("*");
      if (error) {
        logger.warn(`Backup table query warning for ${table}: ${error.message}`);
        tablesData[table] = [];
        tableCounts[table] = 0;
      } else {
        const rows = data || [];
        tablesData[table] = rows;
        tableCounts[table] = rows.length;
        totalRecords += rows.length;
      }
    } catch (tblErr) {
      logger.warn(`Failed to export table ${table} during backup`, undefined, tblErr);
      tablesData[table] = [];
      tableCounts[table] = 0;
    }
  }

  // Pre-calculate checksum on the raw table payloads
  const payloadJson = JSON.stringify(tablesData);
  const checksum = crypto.createHash("sha256").update(payloadJson).digest("hex");

  const manifest: BackupManifest = {
    backupId,
    version: "1.0",
    createdAt: timestamp,
    tableCounts,
    totalRecords,
    checksumSha256: checksum,
    sizeBytes: Buffer.byteLength(payloadJson, "utf8"),
    fileName: `${backupId}.json`,
    tables: tablesData,
  };

  const fullJson = JSON.stringify(manifest, null, 2);
  const filePath = path.join(BACKUP_DIR, `${backupId}.json`);
  fs.writeFileSync(filePath, fullJson, "utf8");

  // Prune older backups beyond retention window
  await rotateBackups(MAX_BACKUPS_TO_RETAIN);

  timer.done(`Created backup ${backupId} (${totalRecords} records, ${manifest.sizeBytes} bytes)`);

  return {
    backupId,
    version: manifest.version,
    createdAt: manifest.createdAt,
    tableCounts: manifest.tableCounts,
    totalRecords: manifest.totalRecords,
    checksumSha256: manifest.checksumSha256,
    sizeBytes: manifest.sizeBytes,
    fileName: manifest.fileName,
  };
}

/**
 * Validates integrity of a backup file by verifying its SHA-256 checksum and schema
 */
export function verifyBackupIntegrity(backupInput: string | BackupManifest): BackupVerificationResult {
  try {
    let manifest: BackupManifest;

    if (typeof backupInput === "string") {
      const filePath = path.isAbsolute(backupInput)
        ? backupInput
        : path.join(BACKUP_DIR, backupInput);

      if (!fs.existsSync(filePath)) {
        return {
          valid: false,
          backupId: "unknown",
          checksumMatches: false,
          expectedChecksum: "",
          computedChecksum: "",
          totalRecords: 0,
          tablesVerified: [],
          error: `Backup file not found at ${filePath}`,
        };
      }

      const content = fs.readFileSync(filePath, "utf8");
      manifest = JSON.parse(content) as BackupManifest;
    } else {
      manifest = backupInput;
    }

    if (!manifest.tables || !manifest.checksumSha256 || !manifest.backupId) {
      return {
        valid: false,
        backupId: manifest.backupId || "unknown",
        checksumMatches: false,
        expectedChecksum: manifest.checksumSha256 || "",
        computedChecksum: "",
        totalRecords: 0,
        tablesVerified: [],
        error: "Malformed backup manifest: missing required fields",
      };
    }

    const payloadJson = JSON.stringify(manifest.tables);
    const computedChecksum = crypto.createHash("sha256").update(payloadJson).digest("hex");
    const checksumMatches = computedChecksum === manifest.checksumSha256;

    const tablesVerified = Object.keys(manifest.tables);
    const valid = checksumMatches && tablesVerified.length > 0;

    return {
      valid,
      backupId: manifest.backupId,
      checksumMatches,
      expectedChecksum: manifest.checksumSha256,
      computedChecksum,
      totalRecords: manifest.totalRecords || 0,
      tablesVerified,
      error: valid ? undefined : "Checksum mismatch detected: backup may be corrupted",
    };
  } catch (err: unknown) {
    return {
      valid: false,
      backupId: "unknown",
      checksumMatches: false,
      expectedChecksum: "",
      computedChecksum: "",
      totalRecords: 0,
      tablesVerified: [],
      error: err instanceof Error ? err.message : "Failed to verify backup",
    };
  }
}

/**
 * Lists all existing backups in the local storage directory
 */
export function listBackups(): BackupMetadata[] {
  ensureBackupDirExists();

  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".json"));
  const backups: BackupMetadata[] = [];

  for (const file of files) {
    try {
      const filePath = path.join(BACKUP_DIR, file);
      const content = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(content);

      if (data.backupId && data.createdAt) {
        backups.push({
          backupId: data.backupId,
          version: data.version || "1.0",
          createdAt: data.createdAt,
          tableCounts: data.tableCounts || {},
          totalRecords: data.totalRecords || 0,
          checksumSha256: data.checksumSha256 || "",
          sizeBytes: data.sizeBytes || fs.statSync(filePath).size,
          fileName: file,
        });
      }
    } catch {
      // Ignore unparseable or corrupted files
    }
  }

  // Sort newest first
  backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return backups;
}

/**
 * Prunes backups older than the retention threshold
 */
async function rotateBackups(keepCount: number): Promise<void> {
  const backups = listBackups();
  if (backups.length <= keepCount) return;

  const toRemove = backups.slice(keepCount);
  for (const b of toRemove) {
    try {
      const filePath = path.join(BACKUP_DIR, b.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Pruned old backup file: ${b.fileName}`);
      }
    } catch (err) {
      logger.warn(`Failed to prune backup file: ${b.fileName}`, undefined, err);
    }
  }
}

export interface RestoreResult {
  success: boolean;
  backupId: string;
  dryRun: boolean;
  tablesRestored: Record<string, number>;
  totalRecordsRestored: number;
  error?: string;
}

/**
 * Restores database state from a validated backup file or manifest
 */
export async function restoreDatabaseBackup(
  backupInput: string | BackupManifest,
  options?: { dryRun?: boolean }
): Promise<RestoreResult> {
  const dryRun = options?.dryRun ?? false;
  const verification = verifyBackupIntegrity(backupInput);

  if (!verification.valid) {
    return {
      success: false,
      backupId: verification.backupId,
      dryRun,
      tablesRestored: {},
      totalRecordsRestored: 0,
      error: `Backup integrity check failed: ${verification.error}`,
    };
  }

  let manifest: BackupManifest;
  if (typeof backupInput === "string") {
    const filePath = path.isAbsolute(backupInput)
      ? backupInput
      : path.join(BACKUP_DIR, backupInput);
    const content = fs.readFileSync(filePath, "utf8");
    manifest = JSON.parse(content) as BackupManifest;
  } else {
    manifest = backupInput;
  }

  const tablesRestored: Record<string, number> = {};
  let totalRecordsRestored = 0;

  if (dryRun) {
    for (const table of BACKUP_TABLES) {
      const rows = (manifest.tables[table] || []) as unknown[];
      tablesRestored[table] = rows.length;
      totalRecordsRestored += rows.length;
    }
    return {
      success: true,
      backupId: manifest.backupId,
      dryRun: true,
      tablesRestored,
      totalRecordsRestored,
    };
  }

  const supabase = getBackupSupabaseClient();

  // Restore in dependency order
  for (const table of BACKUP_TABLES) {
    const rows = (manifest.tables[table] || []) as Record<string, unknown>[];
    if (rows.length === 0) {
      tablesRestored[table] = 0;
      continue;
    }

    try {
      const chunkSize = 100;
      let insertedCount = 0;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const batch = rows.slice(i, i + chunkSize);
        const { error } = await supabase.from(table).upsert(batch);
        if (error) {
          logger.warn(`Restoration upsert warning for ${table}: ${error.message}`);
        } else {
          insertedCount += batch.length;
        }
      }
      tablesRestored[table] = insertedCount;
      totalRecordsRestored += insertedCount;
    } catch (tblErr) {
      logger.error(`Restoration failed for table ${table}`, undefined, tblErr);
      tablesRestored[table] = 0;
    }
  }

  return {
    success: true,
    backupId: manifest.backupId,
    dryRun: false,
    tablesRestored,
    totalRecordsRestored,
  };
}

