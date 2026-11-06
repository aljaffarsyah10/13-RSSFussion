import { z } from "zod";

const envSchema = z.object({
  WORKER_DATABASE_URL: z.string().default("postgres://postgres:postgres@localhost:54322/postgres"),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().default(30000),
  WORKER_CONCURRENCY: z.coerce.number().default(5),
  WORKER_FETCH_TIMEOUT_MS: z.coerce.number().default(15000),
  WORKER_USER_AGENT: z.string().default("RSSFusionBot/1.0 (+https://github.com/rssfusion/rssfusion)"),
  NODE_ENV: z.string().default("development"),
});

export const env = envSchema.parse({
  WORKER_DATABASE_URL: process.env.WORKER_DATABASE_URL,
  WORKER_POLL_INTERVAL_MS: process.env.WORKER_POLL_INTERVAL_MS,
  WORKER_CONCURRENCY: process.env.WORKER_CONCURRENCY,
  WORKER_FETCH_TIMEOUT_MS: process.env.WORKER_FETCH_TIMEOUT_MS,
  WORKER_USER_AGENT: process.env.WORKER_USER_AGENT,
  NODE_ENV: process.env.NODE_ENV,
});
