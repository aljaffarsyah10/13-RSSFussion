import { NextResponse } from "next/server";

function extractErrorDetails(err: unknown): { message: string; code?: string } {
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

export function handleApiError(err: unknown) {
  const { message, code } = extractErrorDetails(err);

  if (message === "UNAUTHORIZED") {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  if (message === "NOT_FOUND" || code === "PGRST116") {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Resource not found" } },
      { status: 404 }
    );
  }

  if (message.startsWith("QUOTA_EXCEEDED")) {
    return NextResponse.json(
      { error: { code: "QUOTA_EXCEEDED", message } },
      { status: 403 }
    );
  }

  if (message.startsWith("SSRF_REJECTED") || message.startsWith("SSRF_BLOCKED")) {
    return NextResponse.json(
      { error: { code: "SSRF_BLOCKED", message } },
      { status: 422 }
    );
  }

  if (message.startsWith("CONFLICT") || code === "23505") {
    return NextResponse.json(
      { error: { code: "CONFLICT", message } },
      { status: 409 }
    );
  }

  if (message.startsWith("RATE_LIMITED")) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message } },
      { status: 429 }
    );
  }

  if (message.startsWith("INTERNAL_ERROR")) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected server error occurred" } },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: { code: "BAD_REQUEST", message } },
    { status: 400 }
  );
}
