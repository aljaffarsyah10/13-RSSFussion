import { NextResponse } from "next/server";
import { metrics } from "@/lib/observability/metrics";
import { errorTracker } from "@/lib/observability/error-tracker";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");
  const acceptHeader = request.headers.get("accept") || "";

  if (format === "prometheus" || acceptHeader.includes("text/plain")) {
    const prometheusText = metrics.getPrometheusMetrics();
    return new Response(prometheusText, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
        "Cache-Control": "no-store, no-cache",
      },
    });
  }

  const jsonMetrics = metrics.getMetricsJson();
  const errorStats = errorTracker.getStats();

  return NextResponse.json(
    {
      metrics: jsonMetrics,
      errors: errorStats,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache",
      },
    }
  );
}
