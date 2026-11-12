# RSSFusion — Release Notes

---

## 🚀 Version 1.1.0 (Advanced Features, Reader Mode & Bulk Actions)

> **Release Version:** 1.1.0  
> **Release Date:** November 12, 2026  
> **Author:** RSSFusion Development Team  

### 1. Summary of Changes

Version 1.1.0 delivers major functional maturity upgrades across article curation, multi-format data export, batch operations, feed synchronization, and user experience.

### 2. New Features & Enhancements

#### 2.1. Bulk Operations Engine (`POST /api/articles/bulk`)
- **Multi-Article Selection:** Interactive selection checkboxes on article cards with one-click `Select All` and `Clear` capabilities.
- **Floating Batch Action Bar:** Sticky toolbar providing instant batch actions:
  - **Bulk Mark as Read / Unread**
  - **Bulk Bookmark / Save to Knowledge Base**
  - **Bulk Unsave / Remove Bookmarks**
- **Mark All Feed as Read:** Convenient button with safety confirmation dialog to mark all matching articles in the current stream as read.

#### 2.2. Distraction-Free Reader Mode (`ArticleReaderDialog`)
- **In-App Reader Modal:** Clean typography view allowing users to read full article descriptions and content snippets without leaving the application.
- **Reading Time & Word Count:** Real-time computation of reading time (`X min read`) and total word counts.
- **Provenance & Metadata:** Display source badges, author attributions, published dates, and matching keyword tags.
- **Integrated Actions:** Direct link copying with feedback, bookmark toggling, read status toggling, and external publication links.

#### 2.3. Multi-Format Intelligence Export (`GET /api/articles/export`)
- **RFC 4180 CSV:** Standard CSV export with full escaping of quotes, commas, and multiline text.
- **Obsidian & Notion Markdown (`.md`):** Formatted Markdown notes containing frontmatter, publication details, keyword tags, and blockquoted snippets.
- **Structured JSON:** Machine-readable payload for external API workflows and automated backups.
- **Context-Aware Export:** Export either currently filtered feed results or the entire saved articles knowledge base.

#### 2.4. Advanced Filtering & Sorting Engine
- **Timeframe Filtering:** Slice feeds by `Past 24 Hours` (`today`), `Past 3 Days` (`3days`), `Past 7 Days` (`7days`), `Past 30 Days` (`30days`), or `All Time`.
- **Flexible Sorting:** Sort articles by `Newest First` (default), `Oldest First`, or `Title (A-Z)`.
- **Saved Only Filter:** Filter feed to show only bookmarked articles directly within the main article feed.
- **Search Query Sanitization:** Protects PostgREST queries by stripping injection delimiters and wildcards.

#### 2.5. Source Synchronization & Management
- **Refresh All Feeds (`POST /api/sources/refresh-all`):** Batch schedule refresh across all enabled feeds with visual spinning feedback and toast notifications.
- **Source Filtering:** Real-time text search across feed titles/URLs and health status filters (`Healthy`, `Needs Attention`, `Disabled`).
- **Telemetry Counter:** Quick status strip indicating total, active, and failing feeds.

#### 2.6. Saved Articles, Keywords & Topics Enhancements
- **Saved Articles Page:** Added real-time text search, topic dropdown filters, sorting, and direct export.
- **Keywords Page:** Added search bar, topic filter, and active/paused status filters.
- **Topics Page:** Added search bar and article/keyword count indicators.

#### 2.7. Keyboard Shortcuts Navigation System
- **Power-User Shortcuts:** Seamless feed navigation via `j`/`k` (next/prev), `o`/`Enter` (open reader), `v` (open publication), `m` (toggle read), `s` (bookmark), `x` (toggle select for bulk actions), and `/` (focus search).
- **Shortcuts Cheatsheet Modal (`?`):** Intuitive dialog listing all active shortcuts with formatted `<kbd>` key badges.

#### 2.8. Feed Auto-Discovery Engine
- **HTML Alternate Link Parsing:** Automatically scans website HTML for `<link rel="alternate" type="application/rss+xml">` or `application/atom+xml` tags.
- **Effortless Subscription:** Users can paste regular blog or publication homepages (e.g. `https://techcrunch.com`), and RSSFusion automatically discovers and resolves the underlying feed URL.

#### 2.9. Dual Reading Density Modes
- **Comfortable Cards vs Compact List:** Switch between magazine preview cards (with image and snippet) and ultra-dense compact headline rows.
- **Client Preference Persistence:** Automatically persists selected density in `localStorage`.

#### 2.10. Smart Research Citations & Web Share
- **Citation Generator:** Instant generation of Markdown and academic citations (`Author (Year). "Title". Publication. URL`).
- **Web Share Integration:** Triggers native OS share sheets on supported mobile and desktop browsers with clipboard fallback.
- **Typography Adjuster:** Dynamic `A-` / `A` / `A+` font size control in Reader View modal.

### 3. Verification & Quality Assurance
- **5 Automated Test Suites:** 22 automated test blocks passing 100% (`npm test`).
- **ESLint:** Clean with `0 errors, 0 warnings`.
- **Production Compilation:** Next.js Turbopack compiled all 38 application routes successfully.

---

## 📦 Version 1.0.0 (Initial Production Release)

> **Release Version:** 1.0.0  
> **Release Date:** November 6, 2026  
> **Author:** RSSFusion Development Team  

### 1. Executive Summary

We are proud to announce the **Version 1.0.0 Production Release** of **RSSFusion**, a modern, high-performance information intelligence platform designed for technology professionals, market researchers, and competitive analysts. 

RSSFusion automates the monitoring, filtering, and aggregation of RSS, Atom, and web publication feeds, transforming fragmented news streams into organized, actionable intelligence.

---

### 2. Key Features Included in v1.0.0

#### 2.1. Feed Management & Ingestion
- **Automated Background Ingestion:** High-throughput polling worker utilizing PostgreSQL `FOR UPDATE SKIP LOCKED` for lock-free parallel execution across hundreds of feeds.
- **Enterprise-Grade SSRF Protection:** Pre-flight DNS resolution and IP range validation strictly blocks loopback addresses, RFC 1918 subnets, and AWS/cloud link-local metadata endpoints (`169.254.169.254`).
- **Real-Time Feed URL Validation:** Automatic discovery and validation of feed metadata (title, site URL, description, item count) directly within the feed creation modal.
- **OPML 2.0 Import & Export:** One-click bulk migration to and from Feedly, Inoreader, and other RSS readers with automated duplicate deduplication.
- **Diagnostics & Health Monitoring:** Real-time visibility into crawler logs, HTTP status codes, latency timings, and consecutive failure counts.

#### 2.2. Intelligence & Organization
- **Exact-Phrase Keyword Monitoring:** Regex word boundary matching flags high-priority articles across all subscribed feeds without false-positive noise.
- **Thematic Topic Clusters:** Group keywords and sources into high-level thematic feeds (e.g., *Artificial Intelligence*, *Fintech*, *Competitor Tracking*).
- **Interactive Feed Reader:** Fast, responsive article stream featuring debounced full-text search, source filtering, topic filtering, and read/unread status filtering.
- **Knowledge Archive (Saved Articles):** One-click bookmarking to build a persistent research library of critical stories.
- **Trend & Activity Analytics:** Native 7-day ingestion trend charts, topic breakdown bars, and top active publisher volume metrics.

#### 2.3. User Experience & Accessibility
- **Modern FE Architecture:** Built on Next.js 16 (App Router), Tailwind CSS v4, Base-UI registry, and OKLCH color tokenization.
- **Adaptive Layout:** Fully responsive dashboard experience across mobile phones (375px+), tablets, and widescreen desktop displays.
- **WCAG 2.1 AA Compliant:** Keyboard navigation with visible focus rings, semantic markup (`<nav>`, `<header>`, `<main>`, `<article>`), and accessible screen reader labeling.
- **Built-in SEO:** Automated generation of `robots.txt` and `sitemap.xml`, Open Graph protocol integration, and Twitter card metadata for public pages.

---

### 3. Security & Quality Assurance

- **Static Typing & Linting:** 100% TypeScript compilation pass (`0 errors`) and clean ESLint checks (`0 errors, 0 warnings`).
- **Comprehensive Test Suite:** 17 automated test blocks spanning unit tests, integration tests, feature validation, and security attack vectors with a 100% pass rate.
- **Strict Data Isolation:** Row Level Security (RLS) policies enforce multi-tenant isolation across all 10 PostgreSQL tables.
- **Production Build:** Next.js Turbopack production compilation cleanly emits application routes with zero warnings.

---

### 4. Deployment Instructions

Refer to the accompanying [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) for detailed deployment walkthroughs covering:
- Supabase PostgreSQL database migration deployment
- Next.js web application deployment on Vercel
- Dedicated worker daemon configuration on Ubuntu VPS via systemd
- DNS, HTTPS, monitoring, and automated backup strategies

---

*RSSFusion — Information Intelligence Engine*
