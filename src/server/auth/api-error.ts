import { NextResponse } from "next/server";

export function handleApiError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);

  if (message === "UNAUTHORIZED") {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  if (message === "NOT_FOUND") {
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

  if (message.startsWith("CONFLICT")) {
    return NextResponse.json(
      { error: { code: "CONFLICT", message } },
      { status: 409 }
    );
  }

  return NextResponse.json(
    { error: { code: "BAD_REQUEST", message } },
    { status: 400 }
  );
}
