import { Pool } from "pg";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { processFeedsJob } from "./jobs/fetch-feeds.js";

logger.info("Initializing RSSFusion dedicated background worker...", {
  intervalMs: env.WORKER_POLL_INTERVAL_MS,
  concurrency: env.WORKER_CONCURRENCY,
  timeoutMs: env.WORKER_FETCH_TIMEOUT_MS,
  userAgent: env.WORKER_USER_AGENT,
});

const pool = new Pool({
  connectionString: env.WORKER_DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

let isRunning = true;
let isJobActive = false;

async function runWorkerLoop() {
  if (isJobActive || !isRunning) return;

  isJobActive = true;
  try {
    await processFeedsJob(pool, env.WORKER_CONCURRENCY);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Unhandled exception in worker polling cycle", { error: message });
  } finally {
    isJobActive = false;
  }
}

// Initial cycle
runWorkerLoop();

// Recurring timer
const intervalId = setInterval(runWorkerLoop, env.WORKER_POLL_INTERVAL_MS);

// Graceful shutdown
async function handleShutdown(signal: string) {
  logger.info(`Received ${signal}. Gracefully stopping RSS worker...`);
  isRunning = false;
  clearInterval(intervalId);

  // Wait if a job cycle is currently in-flight
  let waitCount = 0;
  while (isJobActive && waitCount < 10) {
    logger.info("Waiting for active ingestion jobs to complete...");
    await new Promise((res) => setTimeout(res, 1000));
    waitCount++;
  }

  await pool.end();
  logger.info("Worker database connection pool closed. Exiting process.");
  process.exit(0);
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
