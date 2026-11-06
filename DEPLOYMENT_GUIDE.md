# RSSFusion — Production Deployment & Operations Guide

> **Document:** Production Architecture & Deployment Playbook  
> **Target Release:** Version 1.0.0  
> **Last Updated:** November 6, 2026  

---

## 1. Production Architecture Overview

RSSFusion uses a **modular decoupled architecture** to ensure maximum reliability, cost efficiency, and separation of concerns:

```
[ End Users / Web Browsers ]
             |
             v HTTPS
[ Vercel Edge / CDN / Serverless ]
  • Next.js 16.4.5 App Router
  • Tailwind CSS v4 UI + Base-UI
  • API Route Handlers (CRUD, Auth, Analytics, OPML)
             |
             +-----------------------+
             |                       |
             v HTTPS/WSS             v PostgreSQL Wire (Port 5432/6543)
[ Supabase Managed Platform ] <------+--------------------------+
  • PostgreSQL 15+ Database                                     |
  • Row Level Security (RLS)                                    |
  • Supabase Auth (JWT & Cookies)                               |
                                                                |
                                             [ Dedicated VPS RSS Worker ]
                                               • Ubuntu 24.04 LTS / Debian 12
                                               • Node.js 22 LTS / Systemd / Docker
                                               • Polling Loop (FOR UPDATE SKIP LOCKED)
                                               • Real-time Keyword & Topic Engine
                                               • Notification Dispatcher
```

---

## 2. Environment Variables Checklist

### 2.1. Next.js Web Application (Configured on Vercel)

| Variable | Scope | Description | Example |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Public / Client | Canonical public URL of your deployment | `https://rssfusion.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Client | Supabase Project API endpoint | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Client | Supabase client anon public key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret / Server Only | High-privilege administrative key | `eyJhbGciOi...` |
| `RESEND_API_KEY` | Secret / Server Only | Optional email delivery API key | `re_xxxxxxxxxxxx` |
| `RESEND_FROM_EMAIL` | Secret / Server Only | Verified email sender identity | `RSSFusion Alerts <alerts@rssfusion.com>` |

### 2.2. Dedicated Background Worker (Configured on VPS `.env`)

| Variable | Scope | Description | Recommended Setting |
|---|---|---|---|
| `WORKER_DATABASE_URL` | Secret / Server | Direct PostgreSQL connection string to Supabase | `postgres://postgres:[PWD]@db.[REF].supabase.co:5432/postgres` |
| `WORKER_POLL_INTERVAL_MS` | Server | Polling frequency to check for pending feeds | `30000` (30 seconds) |
| `WORKER_CONCURRENCY` | Server | Number of feeds to process concurrently per cycle | `5` (tune based on VPS CPU/RAM) |
| `WORKER_FETCH_TIMEOUT_MS` | Server | Hard socket timeout for slow/hung RSS sources | `15000` (15 seconds) |
| `WORKER_USER_AGENT` | Server | User-Agent header emitted by ingestion crawler | `RSSFusionBot/1.0 (+https://rssfusion.com/bot)` |

---

## 3. Database Deployment (Supabase)

### 3.1. Option A: Automated Supabase CLI
```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login and Link Project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# 3. Push all sequential migrations
supabase db push
```

### 3.2. Option B: Direct SQL Execution via Supabase Dashboard
Execute the migration scripts in sequential order inside the **Supabase Dashboard > SQL Editor**:
1. [`supabase/migrations/20261106000000_create_initial_schema.sql`](file:///d:/10Project/13-RSSFussion/rssfusion/supabase/migrations/20261106000000_create_initial_schema.sql)
2. [`supabase/migrations/20261106000001_create_notifications_and_settings.sql`](file:///d:/10Project/13-RSSFussion/rssfusion/supabase/migrations/20261106000001_create_notifications_and_settings.sql)

### 3.3. Post-Migration Verification
Run this diagnostic query in SQL Editor to confirm all 10 tables and RLS are active:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```
*Expected: `profiles`, `rss_sources`, `articles`, `topics`, `keywords`, `article_keyword_matches`, `saved_articles`, `article_read_status`, `feed_fetch_logs`, `email_notifications` — all with `rowsecurity = true`.*

---

## 4. Next.js Web Deployment (Vercel)

### 4.1. Option A: Vercel GitHub Integration (Recommended)
1. Push your repository to GitHub / GitLab.
2. In the Vercel Dashboard, select **Add New... > Project** and import the repository.
3. Set **Root Directory** to `rssfusion` (if monorepo) or root.
4. Add the 4 required Environment Variables under **Settings > Environment Variables**.
5. Click **Deploy**.

### 4.2. Option B: Vercel CLI
```bash
# 1. Install CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy to Preview
cd rssfusion
vercel

# 4. Deploy to Production
vercel --prod
```

---

## 5. Dedicated Worker Deployment (Ubuntu VPS)

### 5.1. VPS Prerequisites
```bash
# Update base packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git build-essential

# Verify
node -v  # v22.x
npm -v   # v10.x
```

### 5.2. Create Dedicated System User
```bash
sudo useradd -r -s /bin/false -d /opt/rssfusion rssfusion
sudo mkdir -p /opt/rssfusion/worker
sudo chown -R rssfusion:rssfusion /opt/rssfusion
```

### 5.3. Deploy Worker Application
```bash
# Clone or copy worker files to /opt/rssfusion/worker
cd /opt/rssfusion/worker

# Install dependencies and compile TypeScript
sudo -u rssfusion npm ci --omit=dev
sudo -u rssfusion npm run build

# Create secured production environment file
sudo -u rssfusion cp .env.example .env
sudo -u rssfusion nano .env

# Lock down file permissions (read-only for rssfusion user)
sudo chmod 600 /opt/rssfusion/worker/.env
```

### 5.4. Configure and Enable Systemd Service
```bash
# Copy systemd unit file
sudo cp /opt/rssfusion/worker/rssfusion-worker.service /etc/systemd/system/

# Reload systemd daemon
sudo systemctl daemon-reload

# Enable service on server boot
sudo systemctl enable rssfusion-worker

# Start service
sudo systemctl start rssfusion-worker

# Check operational status
sudo systemctl status rssfusion-worker

# Follow real-time ingestion logs
sudo journalctl -u rssfusion-worker -f
```

---

## 6. DNS & Custom Domain Configuration

In your DNS provider (Cloudflare, Namecheap, Route53), configure the following records:

| Record Type | Host / Name | Target / Value | TTL | Purpose |
|---|---|---|---|---|
| **A** | `@` | `76.76.21.21` (Vercel Anycast IP) | Auto / 300s | Root domain apex |
| **CNAME** | `www` | `cname.vercel-dns.com` | Auto / 300s | WWW subdomain |

*Note: The background worker runs on the VPS without requiring any inbound public ports or public DNS records. All external requests made by the worker are strictly outbound HTTP/HTTPS queries to external RSS publishers.*

---

## 7. Monitoring & Health Checks

1. **Vercel Web Analytics & Logs:**
   - Monitor 5xx server errors, response latencies, and route render times in the Vercel Dashboard under **Logs** and **Speed Insights**.
2. **Worker Process Monitoring:**
   ```bash
   # Check active process state
   sudo systemctl is-active rssfusion-worker

   # Check recent restart count and memory usage
   systemctl show rssfusion-worker --property=ActiveState,SubState,NRestarts,MemoryCurrent
   ```
3. **Database Feed Fetch Diagnostics:**
   - Query recent crawler errors directly from the dashboard UI via `/dashboard/sources > Health & Diagnostics`, or run:
   ```sql
   SELECT source_id, status, http_status, error_message, created_at 
   FROM feed_fetch_logs 
   WHERE status = 'failure' 
   ORDER BY created_at DESC 
   LIMIT 20;
   ```

---

## 8. Backup & Disaster Recovery Strategy

1. **Automated Supabase Backups:**
   - Free Tier: Daily automated backups retained for 7 days.
   - Pro/Team Tier: Daily automated backups + Point-In-Time-Recovery (PITR) with WAL archiving.
2. **Manual Snapshot Command (pg_dump):**
   ```bash
   # Create compressed schema + data snapshot
   pg_dump "postgres://postgres:[PWD]@db.[REF].supabase.co:5432/postgres" \
     -Fc -f "rssfusion_backup_$(date +%Y%m%d_%H%M%S).dump"
   ```
3. **Restoration Command:**
   ```bash
   # Restore snapshot to target database
   pg_restore -d "postgres://postgres:[PWD]@db.[REF].supabase.co:5432/postgres" \
     --clean --if-exists "rssfusion_backup_XXXXXXXX.dump"
   ```

---

## 9. Rollback Playbook

### 9.1. Web Application Rollback (Vercel)
Vercel keeps immutable deployment artifacts for every build:
1. In the Vercel Dashboard, navigate to **Deployments**.
2. Locate the previous stable production deployment.
3. Click the three dots menu `...` and select **Instant Rollback**.
4. Traffic is redirected to the previous build in under 5 seconds with zero downtime.

### 9.2. Worker Rollback (VPS)
```bash
cd /opt/rssfusion/worker
sudo -u rssfusion git checkout PREVIOUS_STABLE_TAG
sudo -u rssfusion npm run build
sudo systemctl restart rssfusion-worker
```

---

## 10. Operational Troubleshooting

| Symptom | Probable Cause | Diagnostic / Remedy |
|---|---|---|
| **Feed Ingestion Error 422** | SSRF Validator rejected URL | Feed resolves to a private IP (`127.x`, `10.x`, `192.168.x`). Verify feed URL is publicly reachable. |
| **Worker Ingestion Stalls** | Worker exhausted connection pool | Check `WORKER_CONCURRENCY` vs PostgreSQL `max_connections`. Ensure timeouts are enforced (`WORKER_FETCH_TIMEOUT_MS=15000`). |
| **Manual Refresh Error 429** | Rate limiting active | Cooldown period of 60 seconds is enforced per feed. Wait 1 minute before retrying. |
| **Authentication Redirect Loop** | Site URL mismatch | Ensure Supabase Auth **Site URL** and **Redirect URLs** match `NEXT_PUBLIC_APP_URL` in Supabase Dashboard. |
