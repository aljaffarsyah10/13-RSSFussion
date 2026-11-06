# ⚡ RSSFusion — Information Intelligence Platform

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%2B_Auth-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)](LICENSE)

> **RSSFusion** is a modern, high-performance Information Intelligence microSaaS and RSS aggregator. It consolidates feeds, filters noise through real-time keyword monitoring and topic clustering, guards against SSRF attacks, and surfaces actionable insights with automated trend analytics.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
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
2. **Filtering Signal from Noise** using customizable keyword alerts and automatic article topic clustering.
3. **Hardening Ingestion Security** with robust Server-Side Request Forgery (SSRF) validation before any network request is issued.
4. **Providing Seamless UX** with OPML import/export, read/unread tracking, saved bookmarks, trend analytics, and email notification digests.

---

## 🏛 System Architecture

RSSFusion is structured as a decoupled architecture: an edge-ready Next.js web application paired with a dedicated background ingestion service communicating via Supabase PostgreSQL with Row Level Security (RLS).

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
                      │  • Full-Text & Trigram Search Indices  │
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
- **Add / Edit / Remove Feeds:** Seamless feed subscription with automatic title and icon extraction.
- **Feed Health Inspector:** Visual indicators displaying HTTP status codes, consecutive failure counts, last successful fetch, and error telemetry.
- **Manual Rate-Limited Refresh:** Trigger immediate updates per feed with a strict 60-second sliding rate limit to prevent feed hammering.
- **OPML 2.0 Import & Export:** Bulk import feeds from NetNewsWire, Feedly, or Inoreader; one-click export of subscribed feeds.

### 🔍 Intelligence & Filtering
- **Real-Time Keyword Monitoring:** Track high-priority terms (e.g., `TypeScript`, `Next.js`, `Security`) with instant highlight tags.
- **Topic Clustering:** Group feeds and incoming articles into distinct topics (Engineering, Design, AI, Security).
- **Read / Unread State:** Toggle article read state with filter toggles to focus only on unread entries.
- **Bookmarks & Saved Articles:** Save items for offline reading or future reference.

### 📊 Analytics & Insights
- **Trend Velocity Card:** Real-time analytics breaking down article influx velocity over the past 7 days.
- **Source Breakdown:** Insights into top publishing sources and topic distribution.

### 🛡 Security & Hardening
- **SSRF Safe Fetcher:** Pre-resolves DNS records and rejects private IPv4/IPv6 blocks (RFC 1918, loopbacks `127.0.0.0/8`, link-local `169.254.0.0/16`, cloud metadata `169.254.169.254`).
- **Stream Limiting & Timeouts:** Strict 10-second timeout and 5 MB payload caps prevent decompression bombs and hanging sockets.
- **Input Sanitization:** Strips malicious markup using DOMPurify patterns before storage.

### 📧 Notifications & Automation
- **Email Digest Service:** Transactional notification engine powered by Resend with database-level idempotency (`email_notifications` table).
- **User Notification Preferences:** Toggle daily, weekly, or real-time alert thresholds directly in Settings.

---

## 🛠 Tech Stack

| Domain | Technology | Description |
|---|---|---|
| **Framework** | Next.js 16.4.5 (App Router, Turbopack) | Modern React Server Components architecture |
| **Language** | TypeScript 5 (Strict Mode) | End-to-end type safety |
| **Styling** | Tailwind CSS v4 + OKLCH Tokens | Native CSS variables with full dark mode support |
| **UI Components**| Base-UI / shadcn-compatible | Accessible primitives, Lucide icons, responsive drawer/dialogs |
| **Database** | PostgreSQL via Supabase | Relational data, RLS, ACID transactions, trigram indices |
| **Authentication**| Supabase Auth (`@supabase/ssr`) | Secure HTTP-only cookies, session refresh middleware |
| **Background Ingestion** | Node.js 22 + `rss-parser` + `tsx` | Scalable worker utilizing `FOR UPDATE SKIP LOCKED` |
| **Email Service** | Resend API | Transactional notification delivery |
| **Testing** | Node test runner + TypeScript test harness | Security, unit, integration, and feature suites |

---

## 📁 Repository Structure

```
rssfusion/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (auth)/                  # Auth layout: /login, /register, /reset-password
│   │   ├── (dashboard)/             # Authenticated shell layout
│   │   │   ├── dashboard/           # Feed overview & trend stats
│   │   │   ├── feeds/               # Feed list & health inspection
│   │   │   ├── topics/              # Topic clustering & management
│   │   │   ├── keywords/            # Keyword alert rules
│   │   │   ├── articles/            # Reader feed view (read/unread toggles)
│   │   │   ├── saved/               # Bookmarked articles
│   │   │   └── settings/            # Preferences, notifications, OPML
│   │   ├── api/                     # 16 RESTful API Route Handlers
│   │   │   ├── feeds/               # CRUD, manual refresh, health
│   │   │   ├── articles/            # Read/unread status, bookmarks
│   │   │   ├── topics/              # Topic endpoints
│   │   │   ├── keywords/            # Keyword endpoints
│   │   │   ├── analytics/           # Trend analytics calculation
│   │   │   ├── opml/                # OPML import & export
│   │   │   └── notifications/       # User notification triggers
│   │   ├── sitemap.ts               # Dynamic XML sitemap generator
│   │   ├── robots.ts                # Dynamic robots.txt
│   │   └── layout.tsx               # Root HTML & Providers
│   ├── components/                  # Reusable UI component library
│   │   ├── ui/                      # Base primitives (button, dialog, input, card, badge)
│   │   ├── feeds/                   # FeedCard, FeedHealthDialog, OpmlDialog
│   │   ├── articles/                # ArticleCard, ReaderView
│   │   ├── analytics/               # TrendAnalyticsCard
│   │   └── layout/                  # Navbar, Sidebar, AppShell
│   └── lib/                         # Core utility libraries
│       ├── api/                     # Typed client wrapper (`ApiError`, native fetch)
│       ├── opml/                    # OPML XML parser & exporter
│       ├── security/                # SSRF guard, IP validator, stream limiter
│       └── supabase/                # Browser, server, and admin Supabase clients
├── worker/                          # Standalone RSS Ingestion Engine
│   ├── src/
│   │   ├── config.ts                # Worker environment & configuration
│   │   ├── db.ts                    # Supabase Admin pool & queue queries
│   │   ├── fetcher.ts               # SSRF-guarded HTTP fetcher
│   │   ├── parser.ts                # RSS/Atom XML normalization
│   │   ├── processor.ts             # De-duplication, keyword matching & storage
│   │   └── index.ts                 # Main continuous polling loop
│   ├── Dockerfile                   # Production container definition
│   ├── rssfusion-worker.service     # Linux systemd daemon service
│   ├── package.json                 # Worker standalone package configuration
│   └── tsconfig.json                # Worker TypeScript configuration
├── supabase/
│   └── migrations/
│       ├── 20261106000000_create_initial_schema.sql
│       └── 20261106000001_create_notifications_and_settings.sql
├── test/                            # Comprehensive Automated Test Suites
│   ├── security-tests.ts            # SSRF, private IP, and size limit checks
│   ├── unit-tests.ts                # OPML parser, URL validator, keyword matches
│   ├── integration-tests.ts         # Route handler validation & mock payloads
│   └── run-all-tests.ts             # Unified runner executing all 4 suites
├── .env.example                     # Web application environment variables template
├── DEPLOYMENT_GUIDE.md              # Production deployment walkthrough
├── RELEASE_NOTES.md                 # Version 1.0.0 release notes
└── TECHNICAL_PLAN.md                # Architectural design document
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
# Clone the repository
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
Create `rssfusion/.env.local` using the provided `.env.example`:

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
Create `rssfusion/worker/.env` using `worker/.env.example`:

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

Execute the SQL migration files in order inside your Supabase project's **SQL Editor** or using the Supabase CLI:

```bash
# Option A: Using Supabase CLI (if linked)
supabase db push

# Option B: Manual execution via Supabase SQL Editor
# 1. Run supabase/migrations/20261106000000_create_initial_schema.sql
# 2. Run supabase/migrations/20261106000001_create_notifications_and_settings.sql
```

The migrations establish:
- Secure tables with Row-Level Security (RLS) policies scoped to `auth.uid()`.
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

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev --turbopack` | Starts local Next.js dev server with fast refresh |
| `build` | `next build` | Creates production-optimized standalone build |
| `start` | `next start` | Runs the production Next.js server |
| `lint` | `next lint` | Executes ESLint to enforce code quality |
| `test` | `npx tsx test/run-all-tests.ts` | Runs security, unit, integration, and feature test suites |
| `typecheck` | `npx tsc --noEmit` | Validates TypeScript types across the entire codebase |

### Background Worker (`rssfusion/worker/`)

| Script | Command | Purpose |
|---|---|---|
| `dev` | `npx tsx src/index.ts` | Runs the worker locally with live TypeScript execution |
| `build` | `tsc` | Transpiles TypeScript source to `./dist` |
| `start` | `node dist/index.js` | Executes the compiled production worker |

---

## 🧪 Testing & Quality Assurance

RSSFusion features an automated test harness covering security, parsers, integration points, and UI logic:

```bash
npm test
```

### Test Suites Included:
- **`test/security-tests.ts`**: Verifies SSRF prevention, IP validator rejection of RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.1`), link-local AWS metadata (`169.254.169.254`), and payload size limits (> 5 MB).
- **`test/unit-tests.ts`**: Verifies OPML 2.0 XML parsing, XML generation, feed normalization, and URL validation routines.
- **`test/integration-tests.ts`**: Verifies API route request-response cycles, error handling contracts, and query string filtering.

Detailed test logs and audit reports can be viewed in [`TEST_REPORT.md`](file:///d:/10Project/13-RSSFussion/rssfusion/TEST_REPORT.md).

---

## 🔒 Security Features

1. **SSRF Guard (`src/lib/security/ssrf-guard.ts`):** Pre-resolves target domain hostnames using DNS lookups and checks each resolved IP against forbidden CIDR ranges before opening an HTTP connection.
2. **Payload Protection:** Network streams are aborted if response headers or raw stream bytes exceed 5 MB, preventing zip-bombs and memory exhaustion.
3. **Database Isolation:** Supabase Row Level Security ensures users can never access, read, update, or delete feeds, topics, keywords, or saved articles belonging to other tenants.
4. **Secure Session Cookies:** Authentication cookies are configured as `HttpOnly`, `SameSite=Lax`, and `Secure` in production environments.

---

## 🚢 Deployment

### 1. Web Application (Vercel)
The web application is tailored for seamless zero-config deployment on Vercel:
1. Import the repository on [Vercel](https://vercel.com).
2. Set Framework Preset to **Next.js**.
3. Supply the environment variables from `.env.example`.
4. Deploy!

### 2. Background Worker (VPS / Docker / Railway)
The background worker runs as a continuous Node.js daemon:

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

For complete step-by-step instructions, see [`DEPLOYMENT_GUIDE.md`](file:///d:/10Project/13-RSSFussion/rssfusion/DEPLOYMENT_GUIDE.md).

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
