export interface MetricSample {
  value: number;
  labels?: Record<string, string>;
  timestamp: number;
}

class MetricsRegistry {
  private counters: Map<string, { value: number; labels?: Record<string, string> }> = new Map();
  private durations: Map<string, number[]> = new Map();
  private startTime: number = Date.now();

  private getMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) return name;
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
    return `${name}{${labelStr}}`;
  }

  public increment(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    const existing = this.counters.get(key);
    if (existing) {
      existing.value += value;
    } else {
      this.counters.set(key, { value, labels });
    }
  }

  public recordDuration(name: string, durationMs: number): void {
    const list = this.durations.get(name) || [];
    list.push(durationMs);
    // Keep max 500 latest observations per metric to prevent unbounded memory
    if (list.length > 500) {
      list.shift();
    }
    this.durations.set(name, list);
  }

  public getSummary(name: string) {
    const list = this.durations.get(name) || [];
    if (list.length === 0) {
      return { count: 0, avg: 0, p50: 0, p95: 0, min: 0, max: 0 };
    }

    const sorted = [...list].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const avg = Math.round(sum / sorted.length);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || max;

    return {
      count: sorted.length,
      avg,
      p50,
      p95,
      min,
      max,
    };
  }

  public getMetricsJson() {
    const memory = process.memoryUsage();
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    const counterObj: Record<string, number> = {};
    for (const [key, item] of this.counters.entries()) {
      counterObj[key] = item.value;
    }

    const durationSummaries: Record<string, ReturnType<typeof this.getSummary>> = {};
    for (const name of this.durations.keys()) {
      durationSummaries[name] = this.getSummary(name);
    }

    return {
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      memory: {
        rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
        heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
        externalMb: Math.round((memory.external / 1024 / 1024) * 100) / 100,
      },
      counters: counterObj,
      latenciesMs: durationSummaries,
    };
  }

  public getPrometheusMetrics(): string {
    const json = this.getMetricsJson();
    const lines: string[] = [];

    lines.push("# HELP process_uptime_seconds Total process uptime in seconds.");
    lines.push("# TYPE process_uptime_seconds gauge");
    lines.push(`process_uptime_seconds ${json.uptimeSeconds}`);

    lines.push("# HELP nodejs_heap_used_bytes Memory heap currently used.");
    lines.push("# TYPE nodejs_heap_used_bytes gauge");
    lines.push(`nodejs_heap_used_bytes ${process.memoryUsage().heapUsed}`);

    lines.push("# HELP nodejs_rss_bytes Resident set size memory.");
    lines.push("# TYPE nodejs_rss_bytes gauge");
    lines.push(`nodejs_rss_bytes ${process.memoryUsage().rss}`);

    for (const [key, item] of this.counters.entries()) {
      lines.push(`${key} ${item.value}`);
    }

    for (const [name, summary] of Object.entries(json.latenciesMs)) {
      lines.push(`${name}_avg_ms ${summary.avg}`);
      lines.push(`${name}_p95_ms ${summary.p95}`);
      lines.push(`${name}_max_ms ${summary.max}`);
      lines.push(`${name}_count ${summary.count}`);
    }

    return lines.join("\n") + "\n";
  }

  public reset(): void {
    this.counters.clear();
    this.durations.clear();
    this.startTime = Date.now();
  }
}

export const metrics = new MetricsRegistry();
