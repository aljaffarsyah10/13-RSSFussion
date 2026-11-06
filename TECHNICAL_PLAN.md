# RSSFusion - Technical Plan (Phase 2)

Source of truth: `PRD and Playbook.md` (PRD sections referenced as PRD §x). This document is a blueprint only. No feature code and no migrations were created in Phase 2.

## 0. Review of Existing Project (Phase 1 baseline)

| Item | Finding |
| --- | --- |
| Framework | Next.js 16.4.5, App Router, `src/` dir, alias `@/*` |
| Language | TypeScript 5.9, `strict: true` |
| Styling / UI | Tailwind v4, shadcn/ui (button, card, input, label, dialog, dropdown-menu, sidebar, badge, table, skeleton + separator, sheet, tooltip), `lucide-react`, `zod` |
| Existing folders | `src/app`, `src/components/ui`, `src/hooks`, `src/lib/utils.ts`, `src/types` |
| Notable config | `next.config.ts` has `cacheComponents: true` and `partialPrefetching: true` (generated defaults of this Next version) |
| Validation | lint, `tsc --noEmit`, `build` all passed at commit `60d6457` |

Observations feeding the plan:
1. `cacheComponents: true` changes the rendering model: request-time data (cookies, auth session) must be read inside `<Suspense>` boundaries. Authenticated dashboard pages are fully dynamic, so this is manageable but must be respected from Phase 4. Decision: keep it, revisit in Phase 4 if it causes friction (see Risk R8).
2. `package.json` contains an extra `cn` package (not used; `cn` helper lives in `src/lib/utils.ts`). Decision: remove it in a later phase (cleanup, not done here since Phase 2 must not modify `package.json`).
3. Repo root (`13-RSSFussion/`) holds the PRD; the git repo and app live in `rssfusion/`. The `worker/` and `supabase/` folders will live inside `rssfusion/` (same repository), per the PRD.

## 1. Architecture Overview

Modular monolith + one dedicated background worker, all in a single repository. No microservices, no Redis/BullMQ in MVP.

```
Browser --> Next.js (Vercel): UI + Route Handlers --> Supabase (Auth + PostgreSQL, RLS)
                                                          ^
VPS: Node.js RSS Worker (polls PostgreSQL, SKIP LOCKED) ---+
        |
        +--> external RSS/Atom feeds (SSRF-guarded)
```

Responsibilities:

| Component | Responsibilities |
| --- | --- |
| Next.js pages | Rendering, forms, client UX. No direct DB queries from Client Components. |
| Route Handlers (`/api`) | Auth check, input validation (Zod), quota enforcement, CRUD, article queries, dashboard stats, source validation (SSRF-guarded fetch). |
| Supabase Auth | Register/login/logout, session cookies. |
| PostgreSQL | System of record, scheduling store, RLS, uniqueness for dedup. |
| Worker | Claim due sources, fetch, parse, normalize, dedup insert, keyword match, update source health, fetch logs, (P1) notifications. No REST API. |

Layering inside Next.js: `route handler -> service -> repository -> Supabase client`. Route handlers stay thin; business rules live in `server/services`.

## 2. Technology Decisions

| Technology | Decision | Reason / Trade-off |
| --- | --- | --- |
| Next.js App Router + Route Handlers | Keep | One deployable for UI + API; solo-dev friendly. Serverless limits are why fetching is outside it. |
| Supabase (PostgreSQL + Auth) | Required by PRD | Auth + RLS + managed Postgres with little ops. Trade-off: vendor coupling; mitigated by plain SQL migrations. |
| `@supabase/supabase-js` + `@supabase/ssr` | Add in Phase 6 (auth in Phase 6 per playbook order) | Cookie-based server session validation. |
| Zod | Already installed | Shared request/response validation; also reused in worker env parsing. |
| `rss-parser` | Add to worker (and web only for source validation) | Handles RSS + Atom. Trade-off: loose typing, so we normalize defensively. |
| `pg` (node-postgres) | Worker only | Needed for `FOR UPDATE SKIP LOCKED` and transactions, which PostgREST/supabase-js cannot express. |
| Native `fetch` / `undici` | Use in worker | Controlled timeout, redirects, size limits; custom `lookup` for DNS-pinned SSRF checks. No Axios. |
| `ipaddr.js` (or `node:net` BlockList) | Prefer built-in `node:net` `BlockList` first | Avoid a dependency if the built-in suffices. |
| Resend | P1 only | Not installed in MVP. |
| Recharts | P1 only | Not installed in MVP. |
| Zustand / TanStack Query | Not now | Server Components + simple fetch is enough; add only when a concrete need appears. |
| Redis / BullMQ | Rejected for MVP | Postgres `SKIP LOCKED` is enough at MVP scale; one fewer service. Revisit when throughput exceeds a single worker. |
| Vitest | Add in Phase 9 (or earlier for pure-logic units) | Unit tests for normalizer, deduper, keyword matcher, SSRF validator, quota. |
| Playwright | Add in Phase 9 | E2E for critical flows. |

## 3. Final Folder Structure

```
rssfusion/
├── src/
│   ├── app/
│   │   ├── (public)/            # /, /pricing, /privacy, /terms (public layout)
│   │   ├── (auth)/              # /login, /register
│   │   ├── dashboard/           # protected: articles, sources, topics, keywords, saved, settings (+P1 analytics, notifications, billing)
│   │   └── api/                 # route handlers (see §5)
│   ├── components/
│   │   ├── ui/                  # shadcn primitives (exists)
│   │   ├── layout/              # AppSidebar, DashboardHeader, PublicNavbar, Footer
│   │   └── shared/              # EmptyState, ErrorState, LoadingSkeleton, Pagination, ConfirmDialog, StatCard
│   ├── features/
│   │   ├── articles/            # ArticleCard, ArticleList, ArticleFilters, ArticleSearch, SavedArticleButton
│   │   ├── sources/             # SourceCard, SourceForm, SourceStatusBadge
│   │   ├── topics/              # TopicCard, TopicForm
│   │   ├── keywords/            # KeywordInput
│   │   └── dashboard/
│   ├── hooks/
│   ├── lib/
│   │   ├── supabase/            # browser/server/service-role client factories
│   │   ├── validation/          # Zod schemas shared by API + forms
│   │   └── utils/
│   ├── server/                  # server-only (import "server-only")
│   │   ├── services/            # business rules: sources, topics, keywords, articles, quota, dashboard
│   │   ├── repositories/        # data access
│   │   └── auth/                # getCurrentUser(), requireUser()
│   └── types/                   # shared domain + API types
├── worker/
│   ├── src/
│   │   ├── index.ts
│   │   ├── config/env.ts
│   │   ├── jobs/{fetch-feeds.ts, process-notifications.ts}   # notifications = P1
│   │   ├── services/{feed-fetcher, feed-parser, article-normalizer, article-deduplicator, keyword-matcher}.ts
│   │   ├── repositories/{source-repository, article-repository}.ts
│   │   └── utils/{logger, retry}.ts
│   ├── package.json
│   └── tsconfig.json
├── supabase/migrations/         # SQL migrations (Phase 6)
├── .env.example
└── TECHNICAL_PLAN.md
```

Shared code: SSRF validator, URL normalizer and keyword matcher are needed by both web and worker. Decision: keep them as pure TypeScript modules in `worker/src` and for the web import a small duplicated or path-referenced copy only if needed. Preferred: put pure shared logic in `src/lib/shared/` and have the worker reference it via `tsconfig` paths/relative import (single source, no npm workspace). Trade-off: the worker build must include that folder; accepted. (Final call in Phase 6.)

## 4. Database Schema (blueprint; no migration in Phase 2)

Conventions: UUID PKs (`gen_random_uuid()`), `TIMESTAMPTZ`, explicit `ON DELETE`, one migration file per change.

### 4.1 Tables

| Table | Key columns / constraints | FKs and on-delete |
| --- | --- | --- |
| `profiles` | `id` PK, `full_name`, `avatar_url`, `plan` (`free\|starter\|pro\|business`, default `free`), timestamps | `id -> auth.users(id)` CASCADE. Row auto-created by trigger on signup. |
| `rss_sources` | PK `id`; `user_id`, `name`, `feed_url`, `site_url`, `description`, `enabled` default true, `last_fetched_at`, `last_success_at`, `next_fetch_at` default now(), `fetch_interval_minutes` default 60 (CHECK 15..1440), `consecutive_failures` default 0, `locked_until`, `last_error`, `etag`, `last_modified`, timestamps. UNIQUE (`user_id`, `feed_url`) | `user_id -> auth.users` CASCADE |
| `articles` | PK `id`; `source_id`, `guid`, `canonical_url`, `original_url`, `title`, `description`, `content_snippet`, `author`, `image_url`, `published_at` (fallback = `fetched_at`), `fetched_at`, `created_at`. | `source_id -> rss_sources` CASCADE |
| `topics` | `id`, `user_id`, `name`, `description`, timestamps. UNIQUE (`user_id`, lower(`name`)) | `user_id` CASCADE |
| `keywords` | `id`, `user_id`, `topic_id` (nullable), `keyword`, `enabled`, `created_at`. UNIQUE (`user_id`, lower(`keyword`)) | `user_id` CASCADE; `topic_id -> topics` SET NULL (topic delete keeps keyword) or CASCADE; decision: **CASCADE**, since PRD ties keywords to a topic's lifecycle. Revisit in Phase 3 UX. |
| `article_keyword_matches` | `id`, `article_id`, `keyword_id`, `matched_at`. UNIQUE (`article_id`, `keyword_id`) | both CASCADE |
| `saved_articles` | `id`, `user_id`, `article_id`, `created_at`. UNIQUE (`user_id`, `article_id`) | both CASCADE |
| `article_read_status` | `id`, `user_id`, `article_id`, `read_at`. UNIQUE (`user_id`, `article_id`) | both CASCADE |
| `feed_fetch_logs` | `id`, `source_id`, `status` (`success\|failed\|not_modified`), `http_status`, `articles_found`, `articles_inserted`, `error_message`, `duration_ms`, `created_at` | `source_id` CASCADE |
| P1: `notification_preferences`, `notification_logs`, `article_topics` | per PRD §13.3 | deferred to Phase 8 |

### 4.2 Article ownership model (important)

PRD §13.2 makes `articles` keyed by `source_id`, and `rss_sources` is user-owned (`user_id`). Therefore each user's source row has its own articles; articles are effectively per-source-row and reachable only through a source the user owns. This avoids a global shared-article model in the MVP (simpler RLS) at the cost of duplicate fetching when two users add the same feed. Accepted trade-off for MVP (see R6). The PRD's "global articles" wording is honored by never exposing an article without checking source ownership.

### 4.3 Deduplication

- Normalized GUID: trimmed GUID text; empty -> NULL.
- Canonical URL: lowercase scheme/host, strip fragment, strip tracking params (`utm_*`, `fbclid`, `gclid`, `mc_*`), remove default ports, trim trailing slash (except root). Fallback: normalized original URL. If neither GUID nor URL exists, derive `guid = 'sha256:' || hash(source_id + title + published_at)`.
- Constraints: partial UNIQUE (`source_id`, `guid`) WHERE `guid IS NOT NULL`; UNIQUE (`source_id`, `canonical_url`). `canonical_url` is NOT NULL (always filled via fallback chain above).
- Insert with `INSERT ... ON CONFLICT DO NOTHING RETURNING id` so concurrent workers cannot create duplicates; `articles_inserted` = rows returned.

### 4.4 Indexes

`rss_sources(user_id)`, partial `rss_sources(next_fetch_at) WHERE enabled`, `articles(source_id, published_at DESC, id DESC)`, `articles(published_at DESC)`, `keywords(user_id)`, `keywords(topic_id)`, `article_keyword_matches(keyword_id, article_id)`, `saved_articles(user_id, created_at DESC)`, `article_read_status(user_id)`, `feed_fetch_logs(source_id, created_at DESC)`. Search (FR-09): start with `ILIKE` on title/description with pagination; add a `tsvector` GIN index (`to_tsvector('simple', title || ' ' || description)`) if ILIKE is too slow (decided in Phase 9 with measurements). `pg_trgm` is an alternative.

### 4.5 RLS policies

RLS enabled on every table. Separate policies per command.

| Table | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `profiles` | `id = auth.uid()` | via trigger only | own row, but `plan` column not user-writable (revoke column UPDATE on `plan` from `authenticated`) | none (cascade from auth) |
| `rss_sources`, `topics`, `keywords`, `saved_articles`, `article_read_status` | `user_id = auth.uid()` | `user_id = auth.uid()` (WITH CHECK) | own rows, `user_id` immutable | own rows |
| `articles` | EXISTS source owned by `auth.uid()` | none for users (worker only) | none | none (cascade only) |
| `article_keyword_matches` | EXISTS keyword with `user_id = auth.uid()` | none for users | none | none |
| `feed_fetch_logs` | EXISTS source owned by user | none | none | none |

`rss_sources` worker-only columns (`locked_until`, `etag`, `last_modified`, `consecutive_failures`, `next_fetch_at`, `last_*`) must not be writable by users: revoke UPDATE on those columns from `authenticated` (or route all writes through server-side services using column allow-lists). The worker connects with a privileged DB role (bypasses RLS).

Composite integrity: `saved_articles`/`article_read_status` inserts must verify the user can see the article (policy `WITH CHECK EXISTS (select 1 from articles a join rss_sources s ... where s.user_id = auth.uid())`) to prevent referencing foreign articles.

### 4.6 Quota

`profiles.plan` maps to limits in a code constant (`src/server/services/quota.ts`) rather than a table in MVP:

| Plan | Sources | Keywords | Topics |
| --- | --- | --- | --- |
| free | 5 | 3 | 3 |
| starter | 30 | 20 | 20 |
| pro | 100 | 100 | 100 |
| business | configurable (per-profile override columns, added when needed) | | |

Enforcement is server-side in the service layer before insert, plus a DB backstop: `BEFORE INSERT` trigger per table counting the user's rows against the plan (prevents race-condition bypass and direct PostgREST calls). Error code `QUOTA_EXCEEDED` (HTTP 403 or 409; decision: **403**). `GET /api/quota` supplies usage for the UI.

### 4.7 Retention

`feed_fetch_logs` older than 30 days deleted by a worker maintenance job (daily). Deleting a source cascades its articles/matches/saved rows (user data, so acceptable).

## 5. API Contracts (Next.js Route Handlers)

Common rules: all routes require an authenticated user (401 `UNAUTHORIZED`) except where stated; input validated with Zod (400 `VALIDATION_ERROR`); ownership failures return 404 (not 403) to avoid leaking existence; JSON error format per PRD §11.1:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```

Pagination: cursor-based `?limit=20&cursor=<opaque base64 of published_at,id>` for articles (stable, no duplicates per FR-08); offset pagination permitted for small lists (sources/topics/keywords). Max `limit` = 50.

| Method | Endpoint | Purpose | Notes |
| --- | --- | --- | --- |
| GET | `/api/articles` | List/search feed | Query: `q`, `sourceId`, `topicId`, `keywordId`, `from`, `to`, `limit`, `cursor`. Filters combinable. Default newest first. Joins read/saved flags. |
| GET | `/api/articles/[id]` | Article detail | Ownership via source. |
| POST | `/api/articles/[id]/read` | Mark read | Idempotent upsert. (Addition to PRD list; needed for `article_read_status`.) |
| GET | `/api/dashboard/stats` | Counts + latest articles + recent activity | |
| GET | `/api/quota` | Plan + usage | (Addition; FR-13 requires usage in UI.) |
| GET | `/api/sources` | List sources with health | |
| POST | `/api/sources` | Create | Quota check, SSRF validation, feed validation, sets `next_fetch_at = now()`. Rate-limited. |
| GET | `/api/sources/[id]` | Detail | Includes recent fetch logs. |
| PATCH | `/api/sources/[id]` | Update name/interval/enabled | `feed_url` change re-triggers validation. |
| DELETE | `/api/sources/[id]` | Delete | |
| POST | `/api/sources/validate` | Validate RSS URL without saving | SSRF guard + parse; rate-limited; returns title, site URL, item count. |
| POST | `/api/sources/[id]/refresh` | Manual refresh | Sets `next_fetch_at = now()` only (worker does the work). Rate-limited. (Addition; PRD §14.4 mentions manual refresh.) |
| GET/POST | `/api/topics` | List / create | Quota. |
| PATCH/DELETE | `/api/topics/[id]` | Update / delete | |
| GET/POST | `/api/keywords` | List / create | Quota; optional `topicId`. |
| PATCH | `/api/keywords/[id]` | Edit/enable (FR-07 requires editing) | Addition to PRD table. |
| DELETE | `/api/keywords/[id]` | Delete | |
| GET | `/api/saved` | List saved | |
| POST | `/api/saved` | Save `{articleId}` | Idempotent. |
| DELETE | `/api/saved/[articleId]` | Unsave | |

Backfill on new keyword: newly created keywords are matched only against future articles by the worker unless a backfill is run. Decision: on keyword create/edit, enqueue a bounded backfill (match against that user's last 30 days / up to 2,000 articles) executed in the service layer via SQL; documented as a Phase 6 task. Trade-off: extra complexity, but without it new keywords show nothing until new articles arrive.

Auth endpoints: Supabase handles register/login/logout. Next.js provides `/auth/callback` (email confirmation) and a server action or route for logout; no custom password handling.

## 6. Authentication Architecture

- Supabase Auth, email + password. Email confirmation configurable (decision: on in production).
- `@supabase/ssr` cookie sessions. Server helper `requireUser()` calls `supabase.auth.getUser()` (validates the JWT with Supabase, not just decoding cookies).
- Route protection: `proxy.ts` (Next 16 middleware replacement) refreshes session and redirects unauthenticated `/dashboard/*` requests to `/login`; every Route Handler and server page additionally calls `requireUser()` (defense in depth, because proxy alone is not a security boundary).
- Server-side data access uses the user-scoped Supabase client so RLS applies. The service-role client is restricted to server-only modules and used only where RLS must be bypassed (e.g. admin tasks); it must never be imported by client code (`import "server-only"`).
- Open redirect protection on `next` param after login (allow relative paths only).

## 7. Worker Architecture

- Separate Node.js TypeScript app in `worker/`, own `package.json`, run with PM2/systemd on a VPS. Connects directly to Postgres (`WORKER_DATABASE_URL`) via `pg` Pool (use Supabase pooler in session/transaction mode as appropriate; `SKIP LOCKED` claim uses a short transaction, which works with the transaction pooler).
- Loop: every `WORKER_POLL_INTERVAL_MS` (default 30s) run `fetchFeedsJob`; guard against overlapping runs in-process.
- Concurrency: `WORKER_CONCURRENCY` (default 5) bounded by a simple promise pool; plus per-host concurrency of 1 to be polite.
- Graceful shutdown on SIGTERM/SIGINT: stop claiming, wait for in-flight jobs (with a hard timeout), release locks, close pool.
- Crash safety: locks expire (`locked_until`), so crashed work is re-claimed.

### 7.1 Claim query (single statement, atomic)

```sql
UPDATE rss_sources s
SET locked_until = now() + interval '5 minutes', last_fetched_at = now()
FROM (
  SELECT id FROM rss_sources
  WHERE enabled = true
    AND next_fetch_at <= now()
    AND (locked_until IS NULL OR locked_until < now())
  ORDER BY next_fetch_at
  LIMIT $1
  FOR UPDATE SKIP LOCKED
) due
WHERE s.id = due.id
RETURNING s.id, s.feed_url, s.etag, s.last_modified, s.consecutive_failures, s.fetch_interval_minutes;
```

Transaction is committed before any HTTP I/O. Lock TTL (5 min) > fetch timeout + processing budget; long-running jobs extend lock if needed.

### 7.2 Per-source pipeline

1. SSRF-guarded fetch (see §9.3) with `If-None-Match` / `If-Modified-Since`, timeout `WORKER_FETCH_TIMEOUT_MS`, max redirects 3, max body 5 MB, `User-Agent: WORKER_USER_AGENT`.
2. HTTP 304 -> log `not_modified`, reschedule, no parse.
3. Parse with `rss-parser` (`parseString` on the already-bounded body).
4. Normalize each item (title trim/decode entities, strip HTML from description, truncate description to ~1000 chars and `content_snippet` to ~500 chars, canonical URL, `published_at` with fallback to `fetched_at`, first image from enclosure/media/`<img>`; image URL must be http(s) only).
5. Batch `INSERT ... ON CONFLICT DO NOTHING RETURNING id, title, description, content_snippet` for newly inserted articles only.
6. Keyword match for new articles against the owning user's enabled keywords (§8); insert matches with `ON CONFLICT DO NOTHING`.
7. Update source: on success `last_success_at = now()`, `consecutive_failures = 0`, `last_error = NULL`, store new `etag`/`last_modified`, `next_fetch_at = now() + fetch_interval`, clear lock. On failure: `consecutive_failures += 1`, `last_error` (sanitized, truncated), `next_fetch_at = now() + min(interval * 2^failures, 24h)`, clear lock.
8. Insert `feed_fetch_logs` row (always, success or failure).
9. Auto-disable policy: after N (default 20) consecutive failures set `enabled = false` with a visible reason (decision to confirm in Phase 6; PRD only requires health display).

Each source is wrapped in try/catch so one failure never stops the batch.

## 8. Keyword Matching

- Normalize: `String.prototype.normalize('NFKC')` (NFC for display), `toLocaleLowerCase()`, collapse whitespace, strip diacritics optional (decision: **do not** strip diacritics in MVP to keep exact-phrase semantics; revisit).
- Haystack = `title + ' ' + description + ' ' + content_snippet`.
- Exact phrase with word boundaries: for Latin text use boundary-aware match (`(?<![\p{L}\p{N}])phrase(?![\p{L}\p{N}])` with `u` flag, phrase regex-escaped) so "ai" does not match "said". For CJK text where no spaces exist, fall back to plain substring.
- Output: set of matched `keyword_id`s -> `article_keyword_matches` (unique pair).
- Scope: only the keywords of the user who owns the article's source, `enabled = true`. Cost is O(items x keywords-per-user), trivial under quotas.

## 9. Security Strategy

### 9.1 General
- Zod validation on all inputs; parameterized queries only (no string-built SQL); `ILIKE` patterns escape `%`/`_`.
- RLS on every table plus service-layer ownership checks.
- Secrets only in env; `.env*` ignored (except `.env.example`); service-role key and worker DB URL never exposed to the browser (no `NEXT_PUBLIC_` prefix).
- Output escaping by React; article descriptions are rendered as plain text (HTML stripped in the worker); external links use `rel="noopener noreferrer nofollow"`.
- Security headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`, frame protections) configured in `next.config.ts` in Phase 9.
- `image_url` shown through `<img>` with `referrerPolicy="no-referrer"`; no `next/image` remote wildcard allow-list in MVP (avoid open proxy).

### 9.2 Rate limiting
Needed on login, register, add source, validate, manual refresh, search (PRD §14.4). Login/register: rely on Supabase Auth built-in limits plus CAPTCHA option later. For app endpoints: Postgres-backed fixed-window counter table (`rate_limits(key, window_start, count)`) using an atomic upsert, avoiding Redis in MVP. Trade-off: DB write per limited request; acceptable at low volume and revisitable (Vercel KV/Upstash later). Decision finalized in Phase 6.

### 9.3 SSRF protection (web validate/create and worker fetch share one module)
1. Parse with `new URL`; allow only `http:`/`https:`; reject credentials in URL and any port other than 80/443 (decision: **80/443 only** in MVP).
2. Resolve DNS (`dns.lookup` with `all: true`); reject if **any** address is loopback, private (10/8, 172.16/12, 192.168/16), link-local (169.254/16, fe80::/10), CGNAT (100.64/10), unique-local (fc00::/7), multicast, unspecified, IPv4-mapped IPv6 of those, or cloud metadata (169.254.169.254, `metadata.google.internal`, `fd00:ec2::254`). Reject hostnames `localhost`, `*.local`, `*.internal`.
3. **Pin the connection to the validated IP** (custom `lookup` in the HTTP agent) to defeat DNS rebinding between check and connect.
4. Follow redirects manually (max 3), re-running steps 1-3 on every hop.
5. Enforce timeout, max response size (stream and abort), content-type sanity (xml/rss/atom/text), no forwarding of cookies/auth headers.
6. Re-validate at every fetch (not only at creation), since DNS can change.
7. VPS: also apply outbound firewall rules blocking RFC1918/metadata ranges as a second layer.
8. Regex-only validation is explicitly not used.

### 9.4 Privacy
Collect only email, optional name/avatar. User deletion cascades personal data. Privacy/Terms pages in Phase 8.

## 10. Environment Variables

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | web (public) | |
| `NEXT_PUBLIC_SUPABASE_URL` | web (public) | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web (public) | Safe only with RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | web server only | Never in client; used sparingly |
| `WORKER_DATABASE_URL` | worker only | Postgres connection (pooler or direct) |
| `WORKER_POLL_INTERVAL_MS` | worker | default 30000 |
| `WORKER_CONCURRENCY` | worker | default 5 |
| `WORKER_FETCH_TIMEOUT_MS` | worker | default 15000 |
| `WORKER_USER_AGENT` | worker | default `RSSFusionBot/1.0` |
| `RESEND_API_KEY` | worker/web, P1 | Optional |

Validated at startup with Zod (`worker/src/config/env.ts`, `src/lib/env.ts`); fail fast on missing required values. `.env.example` is updated per phase when variables are actually introduced (worker vars added in Phase 6).

## 11. Deployment Architecture

| Component | Host | Notes |
| --- | --- | --- |
| Next.js | Vercel | Env vars via Vercel; preview per PR |
| DB + Auth | Supabase | Migrations applied with Supabase CLI (`supabase db push` or CI) |
| Worker | Ubuntu VPS | Node LTS, PM2 or systemd (preferred: systemd with `Restart=always`), `.env` file with 600 perms, structured JSON logs (stdout -> journald), log rotation |
| Reverse proxy | Optional Nginx/Caddy | Worker exposes no public port in MVP; proxy only if a health endpoint is added later |
| Email | Resend (P1) | |
| Docker | Optional | Only if it helps reproducibility |

Release order: DB migration -> worker deploy (must be backward compatible with the previous schema for one release) -> web deploy. Worker health: heartbeat log line every poll and last-run timestamp; (optional later) a `worker_heartbeats` table surfaced in admin/ops.

## 12. Testing Strategy

| Level | Scope | Tooling |
| --- | --- | --- |
| Unit | URL normalizer, dedup key builder, keyword matcher, SSRF validator (IP classification table tests), quota calc, feed normalizer (fixtures of real RSS/Atom incl. malformed) | Vitest |
| Integration | Claim query concurrency (2 workers never claim the same source), `ON CONFLICT` dedup, RLS policies (user A cannot read user B data), quota trigger | Vitest + local Supabase/Postgres |
| API | Route handlers: auth required, validation errors, ownership 404, pagination stability | Vitest / Playwright request context |
| E2E | register -> add source -> articles appear -> create topic/keyword -> save article -> logout | Playwright |
| Static | `npm run lint`, `npx tsc --noEmit`, `npm run build` in every phase | npm scripts |

## 13. Technical Risks

| ID | Risk | Mitigation |
| --- | --- | --- |
| R1 | SSRF through user feed URLs, DNS rebinding, redirects | §9.3 pinned-IP fetch, redirect revalidation, VPS egress rules |
| R2 | Malformed/huge/hostile feeds (XML bombs, giant bodies) | Size cap, timeout, parse in try/catch, limit items per fetch (e.g. 200), sanitize text |
| R3 | Duplicate articles under concurrency / GUID instability | DB unique constraints + `ON CONFLICT`, canonical URL fallback chain |
| R4 | Double processing by multiple workers / crashed worker | `SKIP LOCKED` + `locked_until` expiry, idempotent inserts |
| R5 | Quota bypass via direct API/PostgREST or races | Service checks + DB trigger backstop + RLS grant restrictions |
| R6 | Per-user source rows duplicate fetching of popular feeds | Accepted for MVP; later normalize to shared `feeds` table with `user_sources` |
| R7 | Worker is single point of failure (one VPS) | systemd auto-restart, expiring locks, stale-source alert on UI (`last_success_at`) |
| R8 | `cacheComponents` enabled: dynamic auth data outside Suspense fails build/caches wrongly | Wrap session-dependent trees in `<Suspense>`; if friction, disable flag in Phase 4 (documented decision) |
| R9 | Supabase pooler vs direct connection behavior (prepared statements, `SKIP LOCKED` transactions) | Use transaction pooler with short transactions and no session state, or direct connection; verify in Phase 6 |
| R10 | Search performance with `ILIKE` at scale | Measure; move to `tsvector`/`pg_trgm` index |
| R11 | Dependency vulnerabilities (`npm audit` reported 13 at Phase 1) | Review and upgrade in Phase 9 |
| R12 | Next.js 16 / React 19 / Tailwind 4 / shadcn(base-ui) API differences from older docs | Consult installed versions' docs before coding; keep to documented APIs |

## 14. Development Sequence (maps to Playbook)

| Phase | Output |
| --- | --- |
| 3 | UI/UX plan + design system (tokens, components inventory) |
| 4 | App shell: public/auth/dashboard layouts, sidebar, shared states (mock data) |
| 5 | Core feature screens with mock data (articles, sources, topics, keywords, saved) |
| 6 | Backend: migrations, RLS, auth, services, route handlers, worker, quota, SSRF module |
| 7 | Replace mocks with real API integration |
| 8 | P1 + completion: settings, notifications, analytics, legal pages |
| 9 | Tests, security hardening, performance |
| 10 | Production deployment + release |

## 15. Consistency Check Against PRD

- Stack and constraints (modular monolith, separate worker, Postgres scheduling, no Redis/BullMQ, no mandatory AI): consistent.
- Tables, columns, unique constraints, indexes (§13.2/13.5): consistent; additions are limited to `UNIQUE(user_id, feed_url)`, topic/keyword name uniqueness, `status = not_modified`, and an optional `rate_limits` table, all justified above.
- API list (Playbook Phase 2 Step 4): all included; extra endpoints added (`read`, `quota`, `refresh`, `PATCH keywords`) to satisfy FR-07, FR-10/12, FR-13, §14.4.
- Open items to confirm in later phases: keyword-topic delete behavior (Phase 3/6), auto-disable threshold (Phase 6), shared-logic placement between web and worker (Phase 6), rate-limit storage (Phase 6), `cacheComponents` (Phase 4).
