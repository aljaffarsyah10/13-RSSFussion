# RSSFusion — Production Deployment & Operations Guide

> **Document:** Production Architecture, Rollout & Operations Playbook  
> **Target Release:** Version 1.2.0 (Production-Ready)  
> **Last Updated:** November 2026  

---

## 1. Production Architecture Overview

RSSFusion uses a **modular, decoupled, high-resilience architecture** designed for high throughput, sub-millisecond cache latency, and automated background RSS ingestion:

```
[ End Users / Web Browsers ]
             |
             v HTTPS (HSTS, TLS 1.3)
[ Next.js 16 Web Application ]
  • Turbopack Production Engine
  • App Router (Static Pre-rendering & Dynamic Edge API Routes)
  • Structured JSON Logger + Error Ring Buffer
  • Health Probes (/api/health, /api/health/liveness, /api/health/readiness)
  • Prometheus Metrics Exporter (/api/monitoring/metrics)
             |
             +-----------------------+-----------------------+
             |                       |                       |
             v HTTPS / WSS           v Wire (5432/6543)      v RESP Protocol (6379)
[ Supabase PostgreSQL + Auth ]       |                 [ Redis In-Memory Cache ]
  • Row Level Security (RLS)         |                   • Two-Tier Hybrid Cache
  • 5 Verified Migration Stages      |                   • Cache Invalidation Engine
  • B-Tree & Trigram GIN Indexes     |                   • Quota & Rate Limit Cache
                                     |
                 [ Dedicated Background Ingestion Worker ]
                   • Node.js 22 LTS / Docker / Systemd
                   • SSRF-Safe DNS Pre-resolution & CIDR Guard
                   • FOR UPDATE SKIP LOCKED Concurrency Pool
                   • Real-time Keyword & Topic Engine
                   • Resend Transactional Alert Dispatcher
```

---

## 2. Environment Variables Checklist

### 2.1. Next.js Web Application (`.env.local` / Cloud Platform Secrets)

| Variable | Scope | Description | Production Example |
|---|---|---|---|
| `NODE_ENV` | Server | Node runtime mode | `production` |
| `NEXT_PUBLIC_APP_URL` | Public / Client | Canonical public URL of your deployment | `https://rssfusion.yourdomain.com` |
| `PORT` | Server | Application listening port | `3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Client | Supabase Project API endpoint | `https://[REF].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Client | Supabase public client JWT key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret / Server | Administrative service key (for backups, auth) | `eyJhbGciOi...` |
| `CACHE_DRIVER` | Server | Cache backend selector (`redis` or `memory`) | `redis` |
| `REDIS_URL` | Secret / Server | Redis connection string (Upstash / Managed Redis) | `redis://default:[PWD]@[HOST]:6379` |
| `RESEND_API_KEY` | Secret / Server | Transactional email provider key | `re_xxxxxxxxxxxx` |
| `RESEND_FROM_EMAIL` | Secret / Server | Verified sender email address | `RSSFusion <alerts@yourdomain.com>` |
| `BACKUP_RETENTION_COUNT` | Server | Number of local backup archives to retain | `7` |

### 2.2. Dedicated Background Worker (`worker/.env`)

| Variable | Scope | Description | Recommended Setting |
|---|---|---|---|
| `WORKER_DATABASE_URL` | Secret / Server | Direct PostgreSQL connection string to Supabase | `postgres://postgres:[PWD]@db.[REF].supabase.co:5432/postgres` |
| `WORKER_POLL_INTERVAL_MS` | Server | Frequency of polling loop checking for due feeds | `30000` (30 seconds) |
| `WORKER_CONCURRENCY` | Server | Number of feeds fetched in parallel per cycle | `5` |
| `WORKER_FETCH_TIMEOUT_MS` | Server | Socket timeout for non-responsive feed servers | `15000` (15 seconds) |
| `WORKER_USER_AGENT` | Server | Ingestion crawler HTTP User-Agent header | `RSSFusionBot/1.0 (+https://yourdomain.com/bot)` |

---

## 3. Database Deployment & Migration Audit (Supabase)

### 3.1. Sequential Migrations
RSSFusion maintains 5 sequential, deterministic SQL migrations in `supabase/migrations/`:

1. `20261106000000_create_initial_schema.sql`: Core schema (`profiles`, `rss_sources`, `articles`, `topics`, `keywords`, `saved_articles`, `article_read_status`, `feed_fetch_logs`) with initial triggers and RLS policies.
2. `20261106000001_create_notifications_and_settings.sql`: Notification preferences and email dispatch queues.
3. `20261111000002_audit_security_and_integrity_fixes.sql`: Foreign keys, constraints, and security check validations.
4. `20261113000003_performance_and_scalability_indexes.sql`: Trigram GIN indexes for search and composite B-tree indexes for cursor pagination.
5. `20261114000004_saas_billing_and_onboarding.sql`: Multi-tenancy columns, subscriptions, billing invoices, and onboarding state.

### 3.2. Automated Migration Audit Tool
Before rolling out to production, run the automated verification script:

```bash
npm run verify:migrations
```
*Expected Output: `>>> ALL DATABASE MIGRATIONS VERIFIED SUCCESSFULLY <<<`*

### 3.3. Applying Migrations via Supabase CLI
```bash
# Link project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations
npx supabase db push
```

---

## 4. Production Deployment Options

### Option A: Serverless Web (Vercel) + Dedicated Worker (Railway/Render)

#### 1. Next.js Web on Vercel
1. Import the repository in [Vercel](https://vercel.com).
2. Framework Preset: **Next.js**.
3. Add the required environment variables from Section 2.1.
4. Deploy! Vercel automatically runs Next.js Turbopack compilation and routes edge traffic.

#### 2. Worker on Railway / Render / Fly.io
Deploy the `./worker` directory as a Docker service or Node.js background worker:
- Root directory: `./worker`
- Start command: `npm run build && npm start`
- Environment: Set `WORKER_DATABASE_URL` and worker variables.

---

### Option B: Unified Production Docker Compose (VPS / Self-Hosted)

For single-server deployments (Hetzner, DigitalOcean, AWS EC2):

1. **Clone repository and set up environment:**
   ```bash
   git clone https://github.com/your-org/rssfusion.git /opt/rssfusion
   cd /opt/rssfusion
   cp .env.example .env
   # Edit .env with production credentials
   ```

2. **Launch all services via Docker Compose:**
   ```bash
   docker compose -f docker-compose.production.yml up -d --build
   ```

3. **Verify running containers:**
   ```bash
   docker compose -f docker-compose.production.yml ps
   ```
   *Expected: `rssfusion-web` (healthy), `rssfusion-worker` (running), `rssfusion-redis` (healthy).*

---

## 5. Backup & Disaster Recovery Operations

RSSFusion includes a built-in cryptographic backup and restoration engine:

### 5.1. Creating a Production Database Snapshot
```bash
npm run backup
```
- Exports all application tables into an encrypted, SHA-256 checksummed snapshot in `./backups/`.
- Verifies checksum automatically before concluding.
- Enforces retention policy, pruning backups older than `BACKUP_RETENTION_COUNT` (default: 7).

### 5.2. Disaster Recovery & Restoring from Backup
```bash
# 1. Perform a non-destructive Dry Run to verify schema compatibility and record counts
npm run restore -- --dry-run

# 2. Perform live restoration (upserting into database in proper dependency order)
npm run restore
```

---

## 6. Observability, Health Checks & Monitoring

RSSFusion provides standard health and telemetry endpoints for uptime monitoring and Prometheus/Grafana:

### 6.1. Health Check Probes
- **Deep System Diagnostics:** `GET https://yourdomain.com/api/health`
  - Evaluates database connectivity, query latency, Redis cache response, and memory heap status.
  - Returns HTTP 200 (Healthy), HTTP 207 (Degraded), or HTTP 503 (Unhealthy).
- **Liveness Probe (K8s/Docker):** `GET https://yourdomain.com/api/health/liveness`
- **Readiness Probe (K8s/Docker):** `GET https://yourdomain.com/api/health/readiness`

### 6.2. Prometheus Metrics Scraping
- **Metrics Endpoint:** `GET https://yourdomain.com/api/monitoring/metrics`
  - Supports Prometheus text format (`Accept: text/plain` or `?format=prometheus`).
  - Scrapes: `http_requests_total`, `http_errors_total`, `http_request_duration_ms` (avg, p50, p95, max), `process_uptime_seconds`, `nodejs_heap_used_bytes`.

---

## 7. Production Readiness Checklist

Before public launch, verify the following:

- [ ] All 5 Supabase migrations applied (`npm run verify:migrations`).
- [ ] Database RLS enabled on all 10 public tables.
- [ ] Redis cache configured (`CACHE_DRIVER=redis`) and tested.
- [ ] All 10 automated test suites passing (`npm test`).
- [ ] Zero ESLint warnings or errors (`npm run lint`).
- [ ] Next.js Turbopack production build succeeds (`npm run build`).
- [ ] SSL certificate active with HSTS enabled (A+ on SSL Labs).
- [ ] Web App Manifest and JSON-LD structured data validated.
- [ ] Cron schedule active for daily database snapshot (`npm run backup`).
