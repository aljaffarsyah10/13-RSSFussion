import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cache } from "@/lib/cache/cache-manager";
import { errorTracker } from "@/lib/observability/error-tracker";

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export interface ComponentHealth {
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
  details?: Record<string, unknown>;
}

export interface SystemHealthReport {
  status: HealthStatus;
  timestamp: string;
  uptimeSeconds: number;
  version: string;
  environment: string;
  components: {
    database: ComponentHealth;
    cache: ComponentHealth;
    memory: ComponentHealth;
  };
  metricsSummary: {
    recentErrorsCount: number;
    totalCapturedErrors: number;
  };
}

export async function checkDatabaseHealth(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .limit(1);

    const latencyMs = Date.now() - start;

    if (error) {
      return {
        status: "unhealthy",
        latencyMs,
        message: "Database ping query returned an error",
        details: { code: error.code },
      };
    }

    return {
      status: latencyMs > 1500 ? "degraded" : "healthy",
      latencyMs,
      message: "Database responsive and accepting queries",
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    return {
      status: "unhealthy",
      latencyMs,
      message: err instanceof Error ? err.message : "Database connection failed",
    };
  }
}

export async function checkCacheHealth(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    const testKey = `health_ping:${Date.now()}`;
    await cache.set(testKey, "ok", 5);
    const value = await cache.get<string>(testKey);
    const latencyMs = Date.now() - start;

    if (value === "ok") {
      return {
        status: latencyMs > 500 ? "degraded" : "healthy",
        latencyMs,
        message: "Cache read and write functioning normally",
      };
    }

    return {
      status: "degraded",
      latencyMs,
      message: "Cache read did not return written value",
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    return {
      status: "degraded", // non-fatal fallback
      latencyMs,
      message: err instanceof Error ? err.message : "Cache unavailable, using fallback",
    };
  }
}

export function checkMemoryHealth(): ComponentHealth {
  const mem = process.memoryUsage();
  const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
  const heapTotalMb = Math.round(mem.heapTotal / 1024 / 1024);
  const heapUtilizationPct = Math.round((mem.heapUsed / mem.heapTotal) * 100);

  let status: HealthStatus = "healthy";
  let message = "Memory utilization within normal bounds";

  if (heapUtilizationPct > 90) {
    status = "degraded";
    message = "High heap utilization (>90%)";
  }

  return {
    status,
    message,
    details: {
      heapUsedMb,
      heapTotalMb,
      heapUtilizationPct,
      rssMb: Math.round(mem.rss / 1024 / 1024),
    },
  };
}

export async function getSystemHealthReport(): Promise<SystemHealthReport> {
  const [dbHealth, cacheHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkCacheHealth(),
  ]);

  const memoryHealth = checkMemoryHealth();
  const errorStats = errorTracker.getStats();

  let overallStatus: HealthStatus = "healthy";

  if (dbHealth.status === "unhealthy") {
    overallStatus = "unhealthy";
  } else if (
    dbHealth.status === "degraded" ||
    cacheHealth.status === "degraded" ||
    memoryHealth.status === "degraded"
  ) {
    overallStatus = "degraded";
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: process.env.npm_package_version || "0.1.0",
    environment: process.env.NODE_ENV || "development",
    components: {
      database: dbHealth,
      cache: cacheHealth,
      memory: memoryHealth,
    },
    metricsSummary: {
      recentErrorsCount: errorStats.recentCount,
      totalCapturedErrors: errorStats.totalCaptured,
    },
  };
}
