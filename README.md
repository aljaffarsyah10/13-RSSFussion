# ⚡ RSSFusion — Information Intelligence Platform

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%2B_Auth-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)](LICENSE)

> **RSSFusion** is a high-performance Information Intelligence microSaaS and RSS aggregator. It consolidates feeds, filters noise through real-time keyword monitoring and topic clustering, guards against SSRF attacks, provides distraction-free reader mode, multi-format export, bulk actions, and surfaces actionable insights with automated trend analytics.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
  - [Feed Management & Health Monitoring](#-feed-management--health-monitoring)
  - [Advanced Feed Filtering & Sorting](#-advanced-feed-filtering--sorting)
  - [Bulk Actions & Batch Operations](#-bulk-actions--batch-operations)
  - [Distraction-Free Reader Mode](#-distraction-free-reader-mode)
  - [Multi-Format Intelligence Export](#-multi-format-intelligence-export)
  - [Intelligence & Keyword Monitoring](#-intelligence--keyword-monitoring)
  - [Analytics & Trend Velocity](#-analytics--trend-velocity)
  - [Security & Ingestion Hardening](#-security--ingestion-hardening)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone and Install Dependencies](#1-clone-and-install-dependencies)
  - [2. Environment Variables Configuration](#2-environment-variables-configuration)
  - [3. Database Setup & Migrations](#3-database-setup--migrations)
  - [4. Running the Development Server](#4-running-the-development-server)
  - [5. Running the RSS Background Worker](#5-running-the-rss-background-worker)
- [NPM Scripts Reference](#-npm-scripts-reference)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Security Features](#-security-features)
- [Deployment](#-deployment)
- [Documentation Directory](#-documentation-directory)
- [License](#-license)

---

## 🔭 Overview

In an era of information overload, professionals, researchers, and developers struggle to follow dozens of blogs, news channels, podcasts, and release feeds. RSSFusion solves this by:

1. **Centralizing Feeds** with automated background polling, exponential backoff, and circuit breaker health checks.
2. **Eliminating Noise** via exact phrase keyword alerts, topic clustering, and advanced date range filters.
3. **Streamlining Curation** with batch operations (bulk mark read, bulk save), keyboard shortcuts, and full reader previews.
4. **Exporting Intelligence** into RFC 4180 CSV, Obsidian/Notion-ready Markdown, and structured JSON.
5. **Hardening Ingestion Security** with robust Server-Side Request Forgery (SSRF) validation before any network request is issued.

---

## 🏛 System Architecture

RSSFusion is structured as an edge-ready Next.js 16 web application paired with a dedicated background ingestion service communicating via Supabase PostgreSQL with Row Level Security (RLS).

```
                      ┌────────────────────────────────────────┐
                      │             End User                   │
                      └──────────────────┬─────────────────────┘
                                         │ HTTPS / WSS
                                         ▼
                      ┌────────────────────────────────────────┐
                      │      Next.js 16 Web Application        │
                      │     (App Router, Server Actions,       │
                      │    API Route Handlers, SSR + Client)   │
                      └──────────────────┬─────────────────────┘
                                         │
                   Supabase Client (RLS) │ Service Role (Admin)
                                         ▼
                      ┌────────────────────────────────────────┐
                      │          Supabase PostgreSQL           │
                      │  • Row-Level Security (RLS) Isolation  │
                      │  • SKIP LOCKED Polling Queue           │
                      │  • Trigram & Composite Indices         │
                      └──────────────────▲─────────────────────┘
                                         │
                        Service Role Key │ FOR UPDATE SKIP LOCKED
                                         │
                      ┌──────────────────┴─────────────────────┘
                      │     RSS Background Ingestion Worker    │
                      │  • Node.js 22 + TypeScript             │
                      │  • SSRF-Safe DNS & IP Resolution       │
                      │  • Exponential Backoff & Circuit Break │
                      │  • Keyword & Topic Classifier Engine   │
                      └──────────────────▲─────────────────────┘
                                         │ HTTP GET (Guarded)
                                         │
                      ┌──────────────────┴─────────────────────┐
                      │            External RSS Feeds          │
                      │   (Blogs, Substack, News, Podcasts)    │
                      └────────────────────────────────────────┘
```

---

## ✨ Key Features

### 📡 Feed Management & Health Monitoring

- **Add / Edit / Remove Feeds:** Seamless feed subscription with automatic title, description, and website URL detection.
- **Refresh All Feeds:** One-click batch trigger to schedule ingestion across all active feeds (`POST /api/sources/refresh-all`).
- **Individual Feed Refresh:** Manual refresh per feed protected by a 60-second sliding window rate limit.
- **Source Health Telemetry:** Status badges (`Healthy`, `Needs Attention`, `Disabled`) with error logs and failure counters.
- **Instant Feed Filtering:** Real-time search across feed titles and URLs, alongside health status filters.
- **OPML 2.0 Import & Export:** Full round-trip subscription migration compatible with Feedly, Inoreader, and NetNewsWire.

### 🔍 Advanced Feed Filtering & Sorting

- **Multi-Factor Filtering:** Combine headline/description search queries with specific publication and topic filters.
- **Timeframe Filtering:** Slice article feeds by `Past 24 Hours`, `Past 3 Days`, `Past 7 Days`, `Past 30 Days`, or `All Time`.
- **Flexible Sorting:** Toggle between `Newest First` (default), `Oldest First`, and `Title (A-Z)`.
- **Read & Saved Status:** Dedicated filter toggles for `Unread Only`, `Read Only`, or `Saved / Bookmarked Only`.
- **Search Sanitization:** User queries are sanitized against SQL/PostgREST injection wildcards before execution.

### ⚡ Bulk Actions & Batch Operations

- **Multi-Article Selection:** Select individual articles, select all filtered results, or clear selection with one click.
- **Sticky Batch Toolbar:** Floating action bar appearing automatically upon selection:
  - **Bulk Mark as Read / Unread**
  - **Bulk Bookmark / Save to Knowledge Base**
  - **Bulk Unsave / Remove Bookmarks**
- **Mark All Feed as Read:** Instant button to mark entire filtered streams as read with confirmation protection.

### 📖 Distraction-Free Reader Mode

- **In-App Reader Modal:** Clean typography modal (`ArticleReaderDialog`) to read article content snippets without context switching.
- **Reading Time & Word Count:** Automatic reading time estimation (`X min read`) and exact word counts.
- **Publication Provenance:** Source badge, publication date, author attribution, and topic tags.
- **Quick Actions:** One-click link copying with visual feedback, bookmark toggle, read toggle, and direct publication link.

### 💾 Multi-Format Intelligence Export

- **Export to CSV:** Fully escaped RFC 4180 CSV with quotes, commas, and multiline support.
- **Export to Markdown:** Clean markdown notes ready to import into **Obsidian**, **Notion**, or **Logseq**.
- **Export to JSON:** Machine-readable structured payload containing full article metadata and matched keywords.
- **Filtered & Saved Export:** Export either currently filtered feed results or the entire saved articles knowledge base.

### 🏷 Intelligence & Keyword Monitoring

- **Exact-Phrase Keyword Matching:** Configure alert terms (e.g. `PostgreSQL`, `Series A`, `Next.js 16`) to auto-tag incoming stories.
- **Topic Clustering:** Group articles into thematic folders (e.g. `Artificial Intelligence`, `Fintech`, `Security`).
- **Instant Keyword & Topic Search:** Filter monitored rules and topics with live search bars and active/paused toggles.

### 📊 Analytics & Trend Velocity

- **7-Day Velocity Chart:** Daily article ingestion volume visualizer.
- **Source Breakdown:** Top publishing feeds ranked by volume.
- **Topic Distribution:** Percentage distribution of matched articles across topics.

### 🛡 Security & Ingestion Hardening

- **SSRF Validation:** Pre-resolves DNS records and rejects private IPv4/IPv6 blocks (RFC 1918, loopbacks `127.0.0.0/8`, link-local `169.254.0.0/16`, cloud metadata `169.254.169.254`).
- **Stream Limiting & Timeouts:** Strict 10-second timeout and 5 MB payload caps prevent decompression bombs and hanging sockets.
- **HTML Sanitization:** Strips malicious scripts and dangerous tags using DOMPurify patterns.

---

## 🔌 API Endpoints Reference

| Method   | Endpoint                      | Description                                                                                                      |
| -------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/articles`               | List articles with `q`, `sourceId`, `topicId`, `readStatus`, `savedOnly`, `timeframe`, `sort`, `cursor`, `limit` |
| `POST`   | `/api/articles/[id]/read`     | Mark individual article as read/unread                                                                           |
| `POST`   | `/api/articles/bulk`          | Batch operations (`markRead`, `markUnread`, `save`, `unsave`, `markAllRead`)                                     |
| `GET`    | `/api/articles/export`        | Export articles as `csv`, `markdown`, or `json` attachment                                                       |
| `GET`    | `/api/saved`                  | List user's saved/bookmarked articles                                                                            |
| `POST`   | `/api/saved`                  | Save/bookmark an article                                                                                         |
| `DELETE` | `/api/saved/[articleId]`      | Remove article from bookmarks                                                                                    |
| `GET`    | `/api/sources`                | List all subscribed RSS/Atom sources                                                                             |
| `POST`   | `/api/sources`                | Add a new RSS source with SSRF verification                                                                      |
| `PATCH`  | `/api/sources/[id]`           | Update source name, fetch interval, or enabled status                                                            |
| `DELETE` | `/api/sources/[id]`           | Delete source and cascade delete associated articles                                                             |
| `POST`   | `/api/sources/[id]/refresh`   | Manually trigger refresh for a single source (rate limited)                                                      |
| `POST`   | `/api/sources/refresh-all`    | Schedule immediate refresh across all enabled feeds                                                              |
| `POST`   | `/api/sources/validate`       | Test feed URL validity and extract metadata before adding                                                        |
| `POST`   | `/api/sources/opml/import`    | Import subscriptions from an OPML file or XML string                                                             |
| `GET`    | `/api/sources/opml/export`    | Download subscriptions as an OPML 2.0 XML file                                                                   |
| `GET`    | `/api/topics`                 | List all topics with associated keyword counts                                                                   |
| `POST`   | `/api/topics`                 | Create a new topic cluster                                                                                       |
| `PATCH`  | `/api/topics/[id]`            | Update topic title or description                                                                                |
| `DELETE` | `/api/topics/[id]`            | Delete a topic                                                                                                   |
| `GET`    | `/api/keywords`               | List monitored keywords with topic relationships                                                                 |
| `POST`   | `/api/keywords`               | Add a keyword to monitor                                                                                         |
| `PATCH`  | `/api/keywords/[id]`          | Toggle keyword enabled status or update topic assignment                                                         |
| `DELETE` | `/api/keywords/[id]`          | Remove a keyword rule                                                                                            |
| `GET`    | `/api/analytics/trends`       | Fetch 7-day ingestion stats and topic distributions                                                              |
| `GET`    | `/api/quota`                  | Get current plan quota limits and usage counters                                                                 |
| `GET`    | `/api/settings/notifications` | Get notification preferences and delivery logs                                                                   |
| `POST`   | `/api/settings/notifications` | Update notification preferences                                                                                  |

---

## 🛠 Tech Stack

| Domain                   | Technology                                 | Description                                              |
| ------------------------ | ------------------------------------------ | -------------------------------------------------------- |
| **Framework**            | Next.js 16.4.5 (App Router, Turbopack)     | Modern React Server Components architecture              |
| **Language**             | TypeScript 5 (Strict Mode)                 | End-to-end type safety                                   |
| **Styling**              | Tailwind CSS v4 + OKLCH Tokens             | Low-saturation slate/obsidian palette with dark mode     |
| **UI Components**        | Base-UI / shadcn primitives                | Accessible dialogs, drawers, dropdowns, and Lucide icons |
| **Database**             | PostgreSQL via Supabase                    | Row-Level Security, ACID transactions, trigram indices   |
| **Authentication**       | Supabase Auth (`@supabase/ssr`)            | Secure HTTP-only cookies, session refresh middleware     |
| **Background Ingestion** | Node.js 22 + `rss-parser` + `tsx`          | Scalable worker utilizing `FOR UPDATE SKIP LOCKED`       |
| **Email Service**        | Resend API                                 | Transactional notification delivery                      |
| **Testing**              | Node test runner + TypeScript test harness | Security, unit, integration, and feature suites          |

---

## 📁 Repository Structure

```
rssfusion/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (auth)/                  # Auth layout: /login, /register
│   │   ├── (public)/                # Landing page, /pricing, /privacy, /terms
│   │   ├── dashboard/               # Authenticated dashboard views
│   │   │   ├── page.tsx             # Overview with 4 metric cards & recent highlights
│   │   │   ├── articles/page.tsx    # Reader feed with multi-select, bulk actions, filters
│   │   │   ├── sources/page.tsx     # Feed manager, OPML, health inspection, Refresh All
│   │   │   ├── topics/page.tsx      # Topic clustering & keyword mapping
│   │   │   ├── keywords/page.tsx    # Exact-phrase alert rules
│   │   │   ├── saved/page.tsx       # Personal research library with search & export
│   │   │   └── settings/page.tsx    # Quota status, email alerts, delivery history
│   │   ├── api/                     # RESTful Route Handlers
│   │   │   ├── articles/            # Feed queries, reader status, bulk actions, export
│   │   │   ├── sources/             # Feed CRUD, validation, OPML, refresh-all
│   │   │   ├── topics/              # Topic management
│   │   │   ├── keywords/            # Keyword alerts
│   │   │   ├── analytics/           # Trend velocity calculations
│   │   │   └── settings/            # Notification settings
│   │   ├── globals.css              # OKLCH tokens, glassmorphism, shadow utilities
│   │   └── layout.tsx               # Root layout & providers
│   ├── components/                  # Shared UI components
│   │   ├── ui/                      # Base primitives (button, dialog, card, badge, input)
│   │   ├── layout/                  # AppSidebar, DashboardHeader, PublicNavbar, PublicFooter
│   │   └── shared/                  # PageHeader, StatCard, EmptyState, ErrorState, Skeleton
│   ├── features/                    # Domain-driven feature components
│   │   ├── articles/                # ArticleCard, ArticleFilters, ArticleReaderDialog
│   │   ├── sources/                 # SourceCard, SourceFormDialog, OpmlDialog, HealthDialog
│   │   ├── topics/                  # TopicCard, TopicFormDialog
│   │   ├── keywords/                # KeywordItem, KeywordFormDialog
│   │   └── analytics/               # TrendAnalyticsCard
│   ├── lib/                         # Core utilities
│   │   ├── api/                     # Typed client wrapper (`ApiError`, native fetch)
│   │   ├── rss/                     # Normalizer, feed parser, OPML parser, SSRF validator
│   │   ├── supabase/                # Browser, server, and admin Supabase clients
│   │   └── validation/              # Zod schemas for API and forms
│   └── server/                      # Server-side business logic & services
│       ├── auth/                    # requireUser, ApiError handlers
│       └── services/                # article, source, topic, keyword, quota, opml services
├── worker/                          # Standalone RSS Ingestion Engine
│   ├── src/
│   │   ├── config.ts                # Worker environment & configuration
│   │   ├── db.ts                    # Supabase Admin pool & queue queries
│   │   ├── fetcher.ts               # SSRF-guarded HTTP fetcher
│   │   ├── parser.ts                # RSS/Atom XML normalization
│   │   ├── processor.ts             # De-duplication, keyword matching & storage
│   │   └── index.ts                 # Main continuous polling loop
│   ├── Dockerfile                   # Production container definition
│   └── rssfusion-worker.service     # Linux systemd daemon service
├── supabase/
│   └── migrations/                  # Schema, RLS policies, indices, and triggers
├── test/                            # Comprehensive Automated Test Suites
│   ├── unit-tests.ts                # SSRF IP classification, URL normalizer, keyword match
│   ├── integration-tests.ts         # ApiError mapping, schema validation, pagination contract
│   ├── phase8-tests.ts              # OPML roundtrip, email idempotency, rate limiting
│   ├── security-tests.ts            # 14 SSRF vectors, IP boundaries, XSS HTML stripping
│   └── features-tests.ts            # CSV RFC 4180 escaping, Markdown export, timeframes, bulk limits
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v22.0.0 or higher (`node -v`)
- **NPM**: v10.0.0 or higher (`npm -v`)
- **Supabase Account**: A free cloud instance or local Supabase CLI installation
- **Git**: Installed and configured

---

### 1. Clone and Install Dependencies

```bash
# Clone repository
git clone https://github.com/your-org/rssfusion.git
cd rssfusion

# Install Web application dependencies
npm install

# Install Worker dependencies
cd worker
npm install
cd ..
```

---

### 2. Environment Variables Configuration

#### Web Application (`.env.local`)

Create `.env.local` from the template:

```bash
cp .env.example .env.local
```

Fill in your configuration:

```ini
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend API for Email Notifications (Optional for local dev)
RESEND_API_KEY=re_your_api_key_here
NOTIFICATION_FROM_EMAIL=notifications@yourdomain.com
```

#### Background Worker (`worker/.env`)

Create `worker/.env`:

```bash
cp worker/.env.example worker/.env
```

```ini
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
POLL_INTERVAL_MS=30000
CONCURRENCY=5
MAX_FEED_FETCH_TIMEOUT_MS=10000
```

---

### 3. Database Setup & Migrations

Execute the SQL migration files inside your Supabase project's **SQL Editor** or using the Supabase CLI:

```bash
# Run migrations in order:
# 1. supabase/migrations/20261106000000_create_initial_schema.sql
# 2. supabase/migrations/20261106000001_create_notifications_and_settings.sql
# 3. supabase/migrations/20261111000002_audit_security_and_integrity_fixes.sql
```

The migrations establish:

- Row-Level Security (RLS) policies scoped strictly to `auth.uid()`.
- Queue indexing for polling efficiency (`next_fetch_at`, `status`).
- Trigram full-text search indices for article title and summary search.

---

### 4. Running the Development Server

Start the Next.js development server with Turbopack:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 5. Running the RSS Background Worker

In a separate terminal tab, launch the ingestion worker:

```bash
cd worker
npm run dev
```

The worker connects to Supabase, acquires pending feeds with `FOR UPDATE SKIP LOCKED`, verifies feed security, parses entries, and matches user keywords automatically.

---

## 📜 NPM Scripts Reference

### Web Application (`rssfusion/`)

| Script  | Command                                                       | Purpose                                        |
| ------- | ------------------------------------------------------------- | ---------------------------------------------- |
| `dev`   | `next dev`                                                    | Starts local Next.js dev server with Turbopack |
| `build` | `next build`                                                  | Creates production-optimized standalone build  |
| `start` | `next start`                                                  | Runs the production Next.js server             |
| `lint`  | `eslint`                                                      | Executes ESLint to enforce code quality        |
| `test`  | `tsx test/unit-tests.ts && tsx test/integration-tests.ts ...` | Runs all 5 automated test suites               |

### Background Worker (`rssfusion/worker/`)

| Script  | Command                | Purpose                                                |
| ------- | ---------------------- | ------------------------------------------------------ |
| `dev`   | `npx tsx src/index.ts` | Runs the worker locally with live TypeScript execution |
| `build` | `tsc`                  | Transpiles TypeScript source to `./dist`               |
| `start` | `node dist/index.js`   | Executes the compiled production worker                |

---

## 🧪 Testing & Quality Assurance

RSSFusion features a multi-phase automated test harness covering security, parsers, integration contracts, and advanced feature workflows:

```bash
npm test
```

### 5 Test Suites Included:

1. **`test/unit-tests.ts`**: SSRF IP classification, URL checks, article URL canonicalization, HTML stripping, exact-phrase keyword matching.
2. **`test/integration-tests.ts`**: `ApiError` status mapping, form validation schemas, cursor pagination contracts.
3. **`test/phase8-tests.ts`**: OPML generate & parse round-trip, arbitrary XML resilience, email notification idempotency, manual refresh rate limiting.
4. **`test/security-tests.ts`**: 14 SSRF attack vectors and IP evasion, private/loopback IP boundaries, XSS prevention, canonical URL tracking param stripping, subscription quota boundaries.
5. **`test/features-tests.ts`**: RFC 4180 CSV escaping with quotes/commas, Markdown export generation, timeframe delta calculations, search sanitization, and bulk operation limits.

---

## 🔒 Security Features

1. **SSRF Guard (`src/lib/rss/ssrf-validator.ts`):** Pre-resolves target domain hostnames using DNS lookups and checks each resolved IP against forbidden CIDR ranges before opening an HTTP connection.
2. **Payload Protection:** Network streams are aborted if response headers or raw stream bytes exceed 5 MB, preventing zip-bombs and memory exhaustion.
3. **Database Tenant Isolation:** Supabase Row Level Security ensures users can never access, read, update, or delete feeds, topics, keywords, or saved articles belonging to other accounts.
4. **Input Sanitization:** Strips malicious scripts and dangerous tags using DOMPurify patterns before storage.
5. **Secure Session Cookies:** Authentication cookies are configured as `HttpOnly`, `SameSite=Lax`, and `Secure` in production environments.

---

## 🚢 Deployment

### 1. Web Application (Vercel)

1. Import the repository on [Vercel](https://vercel.com).
2. Set Framework Preset to **Next.js**.
3. Supply the environment variables from `.env.example`.
4. Deploy!

### 2. Background Worker (VPS / Docker / Railway)

- **Docker:**
  ```bash
  cd worker
  docker build -t rssfusion-worker .
  docker run -d --restart unless-stopped --env-file .env rssfusion-worker
  ```
- **Linux systemd:**
  Copy `worker/rssfusion-worker.service` to `/etc/systemd/system/rssfusion-worker.service`, update paths, and run:
  ```bash
  sudo systemctl enable --now rssfusion-worker
  ```

---

## 📚 Documentation Directory

- 📐 [Technical Architecture Plan (`TECHNICAL_PLAN.md`)](file:///d:/10Project/13-RSSFussion/rssfusion/TECHNICAL_PLAN.md)
- 🎨 [UI/UX & Design Tokens Guide (`UI_UX_GUIDE.md`)](file:///d:/10Project/13-RSSFussion/rssfusion/UI_UX_GUIDE.md)
- 🧪 [Verification & Test Audit Report (`TEST_REPORT.md`)](file:///d:/10Project/13-RSSFussion/rssfusion/TEST_REPORT.md)
- 🚀 [Production Deployment Guide (`DEPLOYMENT_GUIDE.md`)](file:///d:/10Project/13-RSSFussion/rssfusion/DEPLOYMENT_GUIDE.md)
- 📦 [Version 1.0.0 Release Notes (`RELEASE_NOTES.md`)](file:///d:/10Project/13-RSSFussion/rssfusion/RELEASE_NOTES.md)

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
Version 1.1
