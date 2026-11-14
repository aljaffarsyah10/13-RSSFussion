# ⚡ RSSFusion — Information Intelligence Platform

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%2B_Auth-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache_%26_Rate_Limiting-dc382d?style=flat-square&logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Production_Compose-2496ed?style=flat-square&logo=docker)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-10_Suites_Passing-brightgreen?style=flat-square)](https://github.com/rssfusion/rssfusion)
[![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)](LICENSE)

> **RSSFusion** is an enterprise-grade Information Intelligence microSaaS and RSS aggregator. It consolidates feeds, filters noise through real-time keyword monitoring and topic clustering, guards against SSRF attacks, provides distraction-free reader mode, multi-format export, bulk actions, surfaces actionable insights with automated trend analytics, and provides production-ready SaaS infrastructure (billing, quota limits, onboarding, observability, health checks, and automated cryptographic backups).

---

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
  - [Feed Management & Auto-Discovery](#-feed-management--auto-discovery)
  - [Advanced Feed Filtering & Sorting](#-advanced-feed-filtering--sorting)
  - [Bulk Actions & Batch Operations](#-bulk-actions--batch-operations)
  - [Distraction-Free Reader Mode](#-distraction-free-reader-mode)
  - [Multi-Format Intelligence Export](#-multi-format-intelligence-export)
  - [SaaS Infrastructure & Multi-Tenancy](#-saas-infrastructure--multi-tenancy)
  - [Observability, Monitoring & Health Probes](#-observability-monitoring--health-probes)
  - [Database Backup & Cryptographic Recovery](#-database-backup--cryptographic-recovery)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
- [NPM Scripts Reference](#-npm-scripts-reference)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Production Deployment](#-production-deployment)
- [License](#-license)

---

## 🔭 Overview

In an era of information overload, professionals, researchers, and developers struggle to follow dozens of blogs, news channels, podcasts, and release feeds. RSSFusion solves this by:

1. **Centralizing Feeds** with automated background polling, exponential backoff, and circuit breaker health checks.
2. **Eliminating Noise** via exact phrase keyword alerts, topic clustering, and advanced date range filters.
3. **Streamlining Curation** with batch operations (bulk mark read, bulk save), keyboard shortcuts, and full reader previews.
4. **Exporting Intelligence** into RFC 4180 CSV, Obsidian/Notion-ready Markdown, and structured JSON.
5. **Hardening Ingestion Security** with robust Server-Side Request Forgery (SSRF) validation before any network request is issued.
6. **Matured SaaS Layer** with subscription tiers (Free, Starter, Pro, Business), monthly/annual billing with 20% discount, quota limit bars, and guided beat onboarding.
7. **Production Observability** with structured JSON logging, credential redaction, health probes, Prometheus metrics exporter, and SHA-256 verified database backups.

---

## 🏛 System Architecture

RSSFusion is structured as an edge-ready Next.js 16 web application paired with a dedicated background ingestion service and a hybrid caching tier communicating via Supabase PostgreSQL:

```
[ End Users / Web Browsers ]
             |
             v HTTPS (HSTS, TLS 1.3)
[ Next.js 16 Web Application ]
  • Turbopack Engine + App Router
  • Structured JSON Logger + Redaction Engine
  • In-Memory Error Tracker Ring Buffer
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

## 🌟 Key Features

### 📡 Feed Management & Auto-Discovery
- **Instant Feed Validation:** Validates RSS 2.0, Atom 1.0, and JSON feeds with live auto-discovery from HTML metadata links.
- **SSRF Defense Guard:** Pre-resolves target domain hostnames using DNS lookups and checks each resolved IP against forbidden CIDR ranges before opening an HTTP connection.
- **Circuit Breaker:** Automatically pauses failing sources with exponential backoff to preserve worker resources.

### 🔍 Advanced Feed Filtering & Sorting
- **Multi-Criteria Filter Bar:** Filter by source, topic cluster, read/unread state, bookmark state, and timeframe (24h, 7d, 30d, all).
- **Trigram Full-Text Search:** Instant search matching article titles, snippets, and authors.
- **Flexible Sorting:** Sort by Published Date (newest/oldest), Source Title, or Relevance.

### ⚡ Bulk Actions & Batch Operations
- **Multi-Select Checkboxes:** Select all visible articles or individually toggle items.
- **Batch Actions Toolbar:** Mark selected as read, mark selected as unread, bulk bookmark, or export selected.

### 📖 Distraction-Free Reader Mode
- **Article Reader Dialog:** Read clean article contents with sanitized typography and responsive layout.
- **One-Click Actions:** Bookmark, mark as read, copy link, and open original source URL.

### 📤 Multi-Format Intelligence Export
- **RFC 4180 CSV Export:** Fully escaped spreadsheet format for Excel and Google Sheets.
- **Markdown Export:** Clean Obsidian and Notion-ready format with article metadata and link lists.
- **Raw JSON Export:** Structured developer export for automation and downstream analysis.

### 💼 SaaS Infrastructure & Multi-Tenancy
- **Plan Tiers:** Free (5 sources), Starter (30 sources), Pro (100 sources), Business (unlimited sources).
- **Billing Cycles:** Monthly and Annual billing with an automatic 20% discount on annual subscriptions.
- **Usage Limit Meters:** Real-time resource usage percentage meters with visual warning banners at $\ge 80\%$ and $100\%$.
- **Guided Onboarding Wizard:** Interactive 2-step setup wizard with curated beat presets (AI & Agents, Engineering, Startups).
- **Workspace Multi-Tenancy:** Workspace organization name and RBAC roles (`owner`, `admin`, `member`).

### 📊 Observability, Monitoring & Health Probes
- **Structured JSON Logger:** Production-grade logger with log levels, timing helpers, and automatic recursive credential redaction.
- **Error Tracker:** In-memory ring buffer with SHA-256 fingerprint deduplication.
- **Health Probes:**
  - `GET /api/health`: Comprehensive system health diagnostics (DB ping, cache latency, memory bounds).
  - `GET /api/health/liveness`: Kubernetes and Docker container liveness probe.
  - `GET /api/health/readiness`: Traffic readiness probe.
- **Prometheus Metrics:** `GET /api/monitoring/metrics` exposes Prometheus scrape format and JSON metrics.

### 🛡️ Database Backup & Cryptographic Recovery
- **Snapshot Generator:** Exports all core tables into a timestamped, SHA-256 verified snapshot archive (`npm run backup`).
- **Disaster Recovery:** Restores database state in strict foreign-key dependency order with dry-run support (`npm run restore -- --dry-run`).
- **Migration Audit:** Verifies all 5 chronological database migrations (`npm run verify:migrations`).

---

## 🛠 NPM Scripts Reference

### Web Application (`rssfusion/`)

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Starts local Next.js dev server with Turbopack |
| `build` | `next build` | Creates production-optimized standalone build |
| `start` | `next start` | Runs the production Next.js server |
| `lint` | `eslint` | Executes ESLint across all TypeScript sources |
| `backup` | `tsx scripts/db-backup.ts` | Creates a verified SHA-256 database backup snapshot |
| `restore` | `tsx scripts/db-restore.ts` | Restores database from a verified backup archive |
| `verify:migrations` | `tsx scripts/verify-migrations.ts` | Audits all 5 chronological database migration files |
| `test` | `tsx test/...` | Executes all 10 automated test suites |

### Background Worker (`rssfusion/worker/`)

| Script | Command | Purpose |
|---|---|---|
| `dev` | `npx tsx src/index.ts` | Runs worker locally with live TypeScript compilation |
| `build` | `tsc` | Transpiles TypeScript source into `./dist` |
| `start` | `node dist/index.js` | Executes the compiled production worker |

---

## 🧪 Testing & Quality Assurance

RSSFusion features 10 comprehensive automated test suites:

```bash
npm test
```

### 10 Automated Test Suites:

1. **`test/unit-tests.ts`**: SSRF IP classification, URL checks, article URL canonicalization, HTML stripping, exact-phrase keyword matching.
2. **`test/integration-tests.ts`**: `ApiError` status mapping, form validation schemas, cursor pagination contracts.
3. **`test/phase8-tests.ts`**: OPML generate & parse round-trip, arbitrary XML resilience, email notification idempotency, manual refresh rate limiting.
4. **`test/security-tests.ts`**: 14 SSRF attack vectors and IP evasion, private/loopback IP boundaries, XSS prevention, canonical URL tracking param stripping, subscription quota boundaries.
5. **`test/features-tests.ts`**: RFC 4180 CSV escaping with quotes/commas, Markdown export generation, timeframe delta calculations, search sanitization, and bulk operation limits.
6. **`test/performance-tests.ts`**: CacheManager get/set/expiration, `remember()` memoization, pattern invalidation, migration index coverage.
7. **`test/e2e-workflow-tests.ts`**: Full end-to-end integration workflows across feed discovery, OPML export/import, keyword engine, and CSRF defense.
8. **`test/saas-infrastructure-tests.ts`**: Subscription tiers, billing discounts, quota usage percentages, onboarding presets, and password validation.
9. **`test/observability-tests.ts`**: Structured logging redaction, AppError hierarchy, error tracker deduplication, metrics histograms, and Prometheus exporter.
10. **`test/production-readiness-tests.ts`**: Environment schema validator, Web App Manifest, Sitemap, Robots directives, migration audit, and dry-run backup restoration.

---

## 🚀 Production Deployment

### Option 1: Docker Compose (Unified Stack)
```bash
cp .env.example .env
docker compose -f docker-compose.production.yml up -d --build
```

### Option 2: Serverless (Vercel)
1. Import repository on [Vercel](https://vercel.com).
2. Configure environment variables from `.env.example`.
3. Deploy!

For complete production rollout procedures, refer to [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
