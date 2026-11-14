import crypto from "crypto";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  traceId?: string;
  userId?: string;
  service?: string;
  action?: string;
  durationMs?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  environment: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "apikey",
  "api_key",
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token",
  "service_role",
  "service_role_key",
]);

/**
 * Recursively redacts sensitive keys to prevent credential leakage in logs
 */
export function sanitizeLogData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (
      SENSITIVE_KEYS.has(lowerKey) ||
      lowerKey.includes("password") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("token")
    ) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

const LOG_LEVEL_PRIORITIES: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export class Logger {
  private serviceName: string;
  private defaultContext: LogContext;
  private minLevel: LogLevel;
  private isProduction: boolean;

  constructor(options?: { service?: string; defaultContext?: LogContext; minLevel?: LogLevel }) {
    this.serviceName = options?.service || "rssfusion";
    this.defaultContext = options?.defaultContext || {};
    this.isProduction = process.env.NODE_ENV === "production";
    this.minLevel = options?.minLevel || (this.isProduction ? "info" : "debug");
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITIES[level] >= LOG_LEVEL_PRIORITIES[this.minLevel];
  }

  public child(serviceName: string, extraContext?: LogContext): Logger {
    return new Logger({
      service: `${this.serviceName}:${serviceName}`,
      defaultContext: { ...this.defaultContext, ...extraContext },
      minLevel: this.minLevel,
    });
  }

  private formatEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    err?: unknown
  ): LogEntry {
    const mergedContext = { ...this.defaultContext, ...context };
    const sanitizedContext = sanitizeLogData(mergedContext) as Record<string, unknown>;

    let errorObj: LogEntry["error"];
    if (err instanceof Error) {
      errorObj = {
        name: err.name,
        message: err.message,
        stack: this.isProduction ? undefined : err.stack,
        code: (err as { code?: string }).code,
      };
    } else if (typeof err === "string") {
      errorObj = { name: "Error", message: err };
    }

    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.serviceName,
      environment: process.env.NODE_ENV || "development",
      context: Object.keys(sanitizedContext).length > 0 ? sanitizedContext : undefined,
      error: errorObj,
    };
  }

  private output(entry: LogEntry): void {
    if (this.isProduction) {
      // Structured JSON format in production
      const json = JSON.stringify(entry);
      if (entry.level === "error") {
        console.error(json);
      } else if (entry.level === "warn") {
        console.warn(json);
      } else {
        console.log(json);
      }
    } else {
      // Clean readable format for local development
      const prefix = `[${entry.timestamp.split("T")[1].slice(0, 8)}] [${entry.level.toUpperCase()}] [${entry.service}]`;
      const ctxStr = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
      if (entry.level === "error") {
        console.error(`${prefix} ${entry.message}${ctxStr}`, entry.error || "");
      } else if (entry.level === "warn") {
        console.warn(`${prefix} ${entry.message}${ctxStr}`);
      } else {
        console.log(`${prefix} ${entry.message}${ctxStr}`);
      }
    }
  }

  public debug(message: string, context?: LogContext): void {
    if (!this.shouldLog("debug")) return;
    this.output(this.formatEntry("debug", message, context));
  }

  public info(message: string, context?: LogContext): void {
    if (!this.shouldLog("info")) return;
    this.output(this.formatEntry("info", message, context));
  }

  public warn(message: string, context?: LogContext, err?: unknown): void {
    if (!this.shouldLog("warn")) return;
    this.output(this.formatEntry("warn", message, context, err));
  }

  public error(message: string, context?: LogContext, err?: unknown): void {
    if (!this.shouldLog("error")) return;
    this.output(this.formatEntry("error", message, context, err));
  }

  /**
   * Helper to time async operations and log their duration
   */
  public startTimer(actionName: string, initialContext?: LogContext) {
    const startTime = Date.now();
    const traceId = initialContext?.traceId || crypto.randomUUID();

    return {
      traceId,
      done: (message?: string, extraContext?: LogContext) => {
        const durationMs = Date.now() - startTime;
        this.info(message || `Completed ${actionName}`, {
          ...initialContext,
          ...extraContext,
          action: actionName,
          traceId,
          durationMs,
        });
        return durationMs;
      },
      fail: (err: unknown, message?: string, extraContext?: LogContext) => {
        const durationMs = Date.now() - startTime;
        this.error(message || `Failed ${actionName}`, {
          ...initialContext,
          ...extraContext,
          action: actionName,
          traceId,
          durationMs,
        }, err);
        return durationMs;
      },
    };
  }
}

export const logger = new Logger();
