import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/server/services/health.service";

export async function GET() {
  const dbHealth = await checkDatabaseHealth();

  if (dbHealth.status === "unhealthy") {
    return NextResponse.json(
      {
        status: "not_ready",
        timestamp: new Date().toISOString(),
        database: dbHealth,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }

  return NextResponse.json(
    {
      status: "ready",
      timestamp: new Date().toISOString(),
      database: dbHealth,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
