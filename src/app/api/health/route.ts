import { NextResponse } from "next/server";
import { getSystemHealthReport } from "@/server/services/health.service";

export async function GET() {
  try {
    const report = await getSystemHealthReport();

    const statusCode =
      report.status === "healthy"
        ? 200
        : report.status === "degraded"
        ? 207 // Multi-Status (partial service functioning)
        : 503; // Service Unavailable

    return NextResponse.json(report, {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: err instanceof Error ? err.message : "Health check inspection failed",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
