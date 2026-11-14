import crypto from "crypto";
import { logger } from "./logger";

export interface ErrorReportContext {
  userId?: string;
  route?: string;
  method?: string;
  requestId?: string;
  statusCode?: number;
  metadata?: Record<string, unknown>;
}

export interface TrackedErrorRecord {
  id: string;
  fingerprint: string;
  name: string;
  message: string;
  stack?: string;
  statusCode: number;
  code: string;
  context?: ErrorReportContext;
  count: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

export type ErrorTrackerHook = (error: Error, record: TrackedErrorRecord) => void;

class ErrorTracker {
  private buffer: Map<string, TrackedErrorRecord> = new Map();
  private maxBufferSize: number = 100;
  private hooks: ErrorTrackerHook[] = [];
  private totalCapturedCount: number = 0;

  /**
   * Generates a stable fingerprint based on error name, code, and top stack frame
   */
  private generateFingerprint(err: Error, code?: string): string {
    const stackTop = err.stack ? err.stack.split("\n")[1]?.trim() || "" : "";
    const raw = `${err.name}:${code || "UNKNOWN"}:${err.message}:${stackTop}`;
    return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16);
  }

  public registerHook(hook: ErrorTrackerHook): () => void {
    this.hooks.push(hook);
    return () => {
      this.hooks = this.hooks.filter((h) => h !== hook);
    };
  }

  public captureException(err: unknown, context?: ErrorReportContext): TrackedErrorRecord {
    this.totalCapturedCount++;
    const now = new Date().toISOString();

    let errorObj: Error;
    let code = "INTERNAL_ERROR";
    let statusCode = context?.statusCode || 500;

    if (err instanceof Error) {
      errorObj = err;
      if ("code" in err && typeof (err as { code: unknown }).code === "string") {
        code = (err as { code: string }).code;
      }
      if ("statusCode" in err && typeof (err as { statusCode: unknown }).statusCode === "number") {
        statusCode = (err as { statusCode: number }).statusCode;
      }
    } else {
      errorObj = new Error(typeof err === "string" ? err : JSON.stringify(err));
    }

    const fingerprint = this.generateFingerprint(errorObj, code);
    const existing = this.buffer.get(fingerprint);

    let record: TrackedErrorRecord;

    if (existing) {
      existing.count += 1;
      existing.lastSeenAt = now;
      existing.context = context || existing.context;
      record = existing;
    } else {
      record = {
        id: crypto.randomUUID(),
        fingerprint,
        name: errorObj.name,
        message: errorObj.message,
        stack: errorObj.stack,
        statusCode,
        code,
        context,
        count: 1,
        firstSeenAt: now,
        lastSeenAt: now,
      };

      // Ring buffer overflow handling (remove oldest)
      if (this.buffer.size >= this.maxBufferSize) {
        const firstKey = this.buffer.keys().next().value;
        if (firstKey) this.buffer.delete(firstKey);
      }

      this.buffer.set(fingerprint, record);
    }

    // Forward to any external APM / Sentry hooks
    for (const hook of this.hooks) {
      try {
        hook(errorObj, record);
      } catch (hookErr) {
        logger.warn("Error tracking hook failed", undefined, hookErr);
      }
    }

    return record;
  }

  public getRecentErrors(limit: number = 20): TrackedErrorRecord[] {
    const records = Array.from(this.buffer.values());
    records.sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());
    return records.slice(0, limit);
  }

  public getStats() {
    const records = Array.from(this.buffer.values());
    const byCode: Record<string, number> = {};
    const byStatus: Record<number, number> = {};

    for (const r of records) {
      byCode[r.code] = (byCode[r.code] || 0) + r.count;
      byStatus[r.statusCode] = (byStatus[r.statusCode] || 0) + r.count;
    }

    return {
      totalCaptured: this.totalCapturedCount,
      uniqueErrors: this.buffer.size,
      byCode,
      byStatus,
      recentCount: records.length,
    };
  }

  public clear(): void {
    this.buffer.clear();
    this.totalCapturedCount = 0;
  }
}

export const errorTracker = new ErrorTracker();
