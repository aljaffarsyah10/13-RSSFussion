import crypto from "crypto";
import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/observability/logger";
import { errorTracker } from "@/lib/observability/error-tracker";
import { metrics } from "@/lib/observability/metrics";

function extractErrorDetails(err: unknown): {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
} {
  if (err instanceof AppError) {
    return {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      details: err.details,
    };
  }
  if (err instanceof Error) {
    const code = (err as { code?: string }).code;
    return { message: err.message, code };
  }
  if (typeof err === "object" && err !== null) {
    const record = err as Record<string, unknown>;
    const message =
      typeof record.message === "string" ? record.message : JSON.stringify(record);
    const code = typeof record.code === "string" ? record.code : undefined;
    return { message, code };
  }
  return { message: String(err) };
}

export function handleApiError(err: unknown, requestContext?: { route?: string; method?: string; userId?: string }) {
  const { message, code, statusCode: explicitStatusCode, details } = extractErrorDetails(err);
  const errorId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  let resolvedStatus = explicitStatusCode || 400;
  let resolvedCode = code || "BAD_REQUEST";
  let resolvedMessage = message;

  if (message === "UNAUTHORIZED") {
    resolvedStatus = 401;
    resolvedCode = "UNAUTHORIZED";
    resolvedMessage = "Authentication required";
  } else if (message === "NOT_FOUND" || code === "PGRST116") {
    resolvedStatus = 404;
    resolvedCode = "NOT_FOUND";
    resolvedMessage = "Resource not found";
  } else if (message.startsWith("QUOTA_EXCEEDED")) {
    resolvedStatus = 403;
    resolvedCode = "QUOTA_EXCEEDED";
    resolvedMessage = message;
  } else if (message.startsWith("SSRF_REJECTED") || message.startsWith("SSRF_BLOCKED")) {
    resolvedStatus = 422;
    resolvedCode = "SSRF_BLOCKED";
    resolvedMessage = message;
  } else if (message.startsWith("CONFLICT") || code === "23505") {
    resolvedStatus = 409;
    resolvedCode = "CONFLICT";
    resolvedMessage = message;
  } else if (message.startsWith("RATE_LIMITED")) {
    resolvedStatus = 429;
    resolvedCode = "RATE_LIMITED";
    resolvedMessage = message;
  } else if (message.startsWith("INTERNAL_ERROR")) {
    resolvedStatus = 500;
    resolvedCode = "INTERNAL_ERROR";
    resolvedMessage = "An unexpected server error occurred";
  } else {
    // Prevent data exposure & reconnaissance: sanitize internal database codes or sensitive syntax errors
    const isInternalDbCode =
      code && (/^(?:42|08|XX|28|53|54|58)/.test(code) || (code.length === 5 && code !== "P0001"));
    const isSensitiveDbMessage =
      /relation.*does not exist|syntax error at or near|violates foreign key|column.*does not exist|password authentication failed/i.test(
        message
      );

    if (isInternalDbCode || isSensitiveDbMessage) {
      resolvedStatus = 500;
      resolvedCode = "INTERNAL_ERROR";
      resolvedMessage = "An unexpected database error occurred";
    }
  }

  // 1. Record in Error Tracker
  errorTracker.captureException(err, {
    statusCode: resolvedStatus,
    route: requestContext?.route,
    method: requestContext?.method,
    userId: requestContext?.userId,
    requestId: errorId,
  });

  // 2. Increment Metrics
  metrics.increment("http_errors_total", 1, {
    code: resolvedCode,
    status: String(resolvedStatus),
  });

  // 3. Structured Logging
  if (resolvedStatus >= 500) {
    logger.error(`API Error [${resolvedCode}]: ${resolvedMessage}`, {
      errorId,
      code: resolvedCode,
      statusCode: resolvedStatus,
      ...requestContext,
    }, err);
  } else {
    logger.warn(`API Warning [${resolvedCode}]: ${resolvedMessage}`, {
      errorId,
      code: resolvedCode,
      statusCode: resolvedStatus,
      ...requestContext,
    });
  }

  return NextResponse.json(
    {
      error: {
        code: resolvedCode,
        message: resolvedMessage,
        errorId,
        timestamp,
        ...(details ? { details } : {}),
      },
    },
    { status: resolvedStatus }
  );
}
