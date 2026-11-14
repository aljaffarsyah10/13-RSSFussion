export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "QUOTA_EXCEEDED"
  | "SSRF_BLOCKED"
  | "CSRF_DETECTED"
  | "DATABASE_ERROR"
  | "EXTERNAL_SERVICE_ERROR"
  | "INTERNAL_ERROR";

export interface AppErrorDetails {
  fields?: Record<string, string>;
  resource?: string;
  retryAfterSeconds?: number;
  [key: string]: unknown;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: AppErrorDetails;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = "INTERNAL_ERROR",
    details?: AppErrorDetails,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found", resource?: string) {
    super(message, 404, "NOT_FOUND", resource ? { resource } : undefined);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access denied") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Validation failed", fields?: Record<string, string>) {
    super(message, 400, "VALIDATION_ERROR", { fields });
  }
}

export class QuotaExceededError extends AppError {
  constructor(message: string = "Subscription quota exceeded", details?: AppErrorDetails) {
    super(message, 403, "QUOTA_EXCEEDED", details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests", retryAfterSeconds?: number) {
    super(message, 429, "RATE_LIMITED", { retryAfterSeconds });
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = "Database operation failed") {
    super(message, 500, "DATABASE_ERROR", undefined, true);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = "External service unavailable", service?: string) {
    super(message, 502, "EXTERNAL_SERVICE_ERROR", service ? { service } : undefined, true);
  }
}
