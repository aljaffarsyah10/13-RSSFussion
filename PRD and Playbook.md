Berikut dokumen lengkap PRD & Sequential Development Playbook untuk RSSFusion – Information Intelligence. Dokumen ini dirancang sebagai pedoman utama pengembangan menggunakan VS Code, Cursor, Claude Code, GitHub Copilot, Antigravity, atau AI Coding Assistant lainnya.

Keputusan arsitektur utama yang digunakan adalah Next.js + Supabase + Dedicated RSS Background Worker. RSSFusion membutuhkan proses pengambilan RSS secara berkala, sehingga proses tersebut tidak akan dibebankan kepada Next.js Serverless Functions.

# RSSFUSION — PRODUCT REQUIREMENTS DOCUMENT & SEQUENTIAL DEVELOPMENT PLAYBOOK

**Document:** `PROJECT_PRD_AND_PLAYBOOK.md`\
**Product:** RSSFusion – Information Intelligence\
**Version:** 1.0.0\
**Status:** Development Specification\
**Platform:** Web Application\
**Development Model:** Solo Developer + AI Coding Assistant\
**Architecture:** Modular Monolith + Dedicated Background Worker\
**Primary Stack:** Next.js, TypeScript, Supabase, PostgreSQL

---

# PART A — PRODUCT REQUIREMENTS DOCUMENT (PRD)

# 1. PRODUCT INFORMATION

## 1.1 Product Identity

| Item                  | Description                                      |
| --------------------- | ------------------------------------------------ |
| Product Name          | RSSFusion                                        |
| Product Category      | Information Intelligence / RSS Aggregator        |
| Product Type          | MicroSaaS                                        |
| Platform              | Web Application                                  |
| Target Users          | Public                                           |
| Primary Language      | English initially, Indonesian support can follow |
| Business Model        | Freemium SaaS                                    |
| Development Approach  | MVP First                                        |
| Development Team      | Solo Developer                                   |
| Architecture          | Modular Monolith                                 |
| Frontend              | Next.js App Router                               |
| Backend               | Next.js Route Handlers                           |
| Background Processing | Dedicated Node.js Worker                         |
| Database              | Supabase PostgreSQL                              |
| Authentication        | Supabase Auth                                    |
| RSS Parsing           | rss-parser                                       |
| Styling               | Tailwind CSS                                     |
| UI Components         | shadcn/ui                                        |
| Client State          | React State / Zustand when needed                |
| Deployment            | Vercel + VPS Worker                              |

## 1.2 Product Description

RSSFusion adalah platform Information Intelligence yang mengumpulkan informasi dari berbagai sumber internet ke dalam satu dashboard terpusat.

Pengguna dapat menambahkan berbagai sumber informasi seperti:

- Website berita.
- Blog teknologi.
- RSS Feed.
- Atom Feed.
- Publikasi penelitian.
- Website perusahaan.
- Media industri.
- Sumber informasi kompetitor.

Pengguna kemudian dapat menentukan keyword atau topik yang ingin dipantau.

RSSFusion secara otomatis mengambil artikel terbaru dari sumber tersebut, menyimpannya ke database, mengelompokkannya berdasarkan topik, dan menampilkannya dalam dashboard.

Tujuan utamanya adalah membantu pengguna menemukan informasi relevan tanpa harus membuka banyak website secara manual.

## 1.3 Development Constraints

1. MVP harus dapat dikembangkan oleh satu developer.
2. Gunakan modular monolith, bukan microservices.
3. Next.js menjadi frontend sekaligus backend API utama.
4. Background RSS fetching harus berjalan di luar lifecycle request serverless.
5. Gunakan PostgreSQL sebagai penyimpanan utama.
6. Jangan menyimpan seluruh konten artikel jika tidak diperlukan.
7. Prioritaskan RSS dan Atom Feed daripada web scraping.
8. Jangan menggunakan AI API berbayar sebagai dependency wajib MVP.
9. Semua fitur berbayar harus memiliki mekanisme quota enforcement.
10. Setiap phase harus diselesaikan dan diverifikasi sebelum melanjutkan.

---

# 2. PRODUCT OVERVIEW

## 2.1 Problem Statement

Pengguna yang mengikuti banyak topik atau industri menghadapi beberapa permasalahan.

### Problem 1 — Information Fragmentation

Informasi tersebar di berbagai website.

Pengguna harus membuka banyak website untuk mendapatkan gambaran perkembangan suatu topik.

### Problem 2 — Information Overload

Jumlah artikel yang dipublikasikan setiap hari sangat banyak.

Tidak semua artikel relevan dengan kebutuhan pengguna.

### Problem 3 — Manual Monitoring

Pengguna harus secara manual memeriksa website untuk mengetahui apakah ada informasi baru.

### Problem 4 — Difficult Information Tracking

Sulit mengetahui perkembangan suatu topik dari waktu ke waktu apabila artikel berasal dari banyak sumber.

### Problem 5 — Missed Important Information

Informasi penting dapat terlewat karena pengguna tidak memeriksa semua sumber secara konsisten.

## 2.2 Proposed Solution

RSSFusion menyediakan satu platform untuk:

1. Mengumpulkan informasi dari berbagai RSS Feed.
2. Mengambil artikel terbaru secara otomatis.
3. Memantau keyword dan topik tertentu.
4. Mengelompokkan artikel berdasarkan relevansi.
5. Menyediakan pencarian dan filter.
6. Menyimpan artikel penting.
7. Menampilkan perkembangan publikasi suatu topik.
8. Mengirimkan notifikasi artikel baru.

## 2.3 Product Workflow

```
USER
  |
  v
REGISTER / LOGIN
  |
  v
DASHBOARD
  |
  +--------------------------+
  |                          |
  v                          v
ADD RSS SOURCE           CREATE TOPIC
  |                          |
  v                          v
VALIDATE FEED             ADD KEYWORDS
  |                          |
  v                          |
SAVE SOURCE                  |
  |                          |
  +-------------+------------+
                |
                v
        BACKGROUND WORKER
                |
                v
          FETCH RSS FEED
                |
                v
          PARSE ARTICLES
                |
                v
       NORMALIZE + DEDUPLICATE
                |
                v
           SAVE TO DATABASE
                |
                v
       MATCH KEYWORD / TOPIC
                |
                v
        UPDATE USER FEED
                |
         +------+------+
         |             |
         v             v
      DASHBOARD    NOTIFICATION
         |
         v
     USER ACTION
         |
    +----+-----+
    |          |
    v          v
  SAVE      READ ARTICLE
 ARTICLE
```

## 2.4 Core Value Proposition

**One dashboard. Multiple sources. Relevant information.**

RSSFusion bukan sekadar RSS Reader.

Produk ini bertujuan berkembang menjadi Information Intelligence Platform yang membantu pengguna memahami perkembangan topik, industri, dan kompetitor.

---

# 3. PRODUCT GOALS

## 3.1 MVP Goals

| ID    | Goal                                    | Success Metric                         |
| ----- | --------------------------------------- | -------------------------------------- |
| PG-01 | Pengguna dapat membuat akun             | Authentication berfungsi               |
| PG-02 | Pengguna dapat menambahkan RSS Feed     | Feed berhasil divalidasi dan disimpan  |
| PG-03 | Sistem dapat mengambil artikel otomatis | Worker berhasil melakukan fetch        |
| PG-04 | Artikel tidak terduplikasi              | Unique constraint bekerja              |
| PG-05 | Pengguna dapat membuat keyword          | Keyword tersimpan dan dapat digunakan  |
| PG-06 | Artikel dapat dikelompokkan             | Matching menghasilkan hasil yang benar |
| PG-07 | Pengguna dapat mencari artikel          | Search menghasilkan hasil relevan      |
| PG-08 | Pengguna dapat menyimpan artikel        | Saved articles berfungsi               |
| PG-09 | Dashboard menampilkan statistik         | Data berasal dari database             |
| PG-10 | Sistem dapat berjalan production        | Web dan worker berjalan stabil         |

## 3.2 Operational Goals

Target awal:

- Mendukung minimal 100 RSS sources dalam satu deployment.
- Mendukung minimal 100 pengguna awal.
- RSS fetching berjalan setiap 5–15 menit.
- Tidak terjadi duplikasi artikel.
- Artikel terbaru dapat muncul setelah proses fetch berhasil.
- API utama memiliki response time yang wajar.
- Worker dapat pulih setelah restart.
- Kesalahan satu RSS source tidak menghentikan proses sumber lainnya.

Angka tersebut merupakan target MVP awal, bukan jaminan kapasitas infrastruktur.

---

# 4. TARGET USERS

## 4.1 Journalists and Media

Kebutuhan:

- Memantau berita terbaru.
- Mengikuti perkembangan isu.
- Mencari artikel dari berbagai media.
- Mengidentifikasi topik yang sedang ramai.

## 4.2 Researchers and Academics

Kebutuhan:

- Memantau publikasi penelitian.
- Mengikuti perkembangan bidang akademik.
- Mengumpulkan referensi.
- Melacak perkembangan suatu topik.

## 4.3 Digital Marketers

Kebutuhan:

- Memantau industri.
- Mengikuti tren konten.
- Memantau kompetitor.
- Menemukan inspirasi konten.

## 4.4 Business Intelligence

Kebutuhan:

- Memantau perkembangan industri.
- Mengikuti berita perusahaan.
- Mengamati kompetitor.
- Melihat tren publikasi.

## 4.5 General Users

Kebutuhan:

- Mengikuti topik yang disukai.
- Mengumpulkan informasi dari banyak website.
- Membaca artikel melalui satu dashboard.
- Menyimpan informasi penting.

---

# 5. SCOPE & FEATURE PRIORITIES

## 5.1 P0 — Core MVP

Fitur yang wajib tersedia untuk peluncuran MVP.

| Feature                 | Description                                |
| ----------------------- | ------------------------------------------ |
| Authentication          | Register, login, logout                    |
| Dashboard               | Ringkasan informasi dan aktivitas          |
| RSS Source Management   | Tambah, lihat, hapus, dan mengelola sumber |
| RSS Feed Validation     | Memeriksa URL dan validitas RSS            |
| RSS Background Fetching | Mengambil artikel secara otomatis          |
| Article Management      | Menyimpan dan menampilkan artikel          |
| Article Deduplication   | Mencegah artikel duplikat                  |
| Keyword Management      | Membuat dan mengelola keyword              |
| Topic Management        | Membuat kategori atau topik                |
| Keyword Matching        | Menghubungkan artikel dengan keyword       |
| Article Feed            | Menampilkan artikel terbaru                |
| Search & Filter         | Mencari dan menyaring artikel              |
| Saved Articles          | Menyimpan artikel favorit                  |
| Responsive UI           | Mendukung desktop dan mobile               |

## 5.2 P1 — Supporting Features

Fitur setelah core MVP stabil.

| Feature                 | Description                                 |
| ----------------------- | ------------------------------------------- |
| Email Notification      | Mengirim email artikel baru                 |
| Trend Dashboard         | Grafik jumlah artikel per topik             |
| Feed Health Monitoring  | Status kesehatan RSS source                 |
| Manual Refresh          | Pengguna meminta refresh sumber             |
| OPML Import             | Mengimpor daftar RSS dari OPML              |
| OPML Export             | Mengekspor daftar RSS                       |
| Read Status             | Menandai artikel sudah dibaca               |
| Article Summary         | Ringkasan artikel berbasis metadata atau AI |
| Advanced Filtering      | Filter lebih lengkap                        |
| Subscription Management | Mengelola paket pengguna                    |

## 5.3 P2 — Future Development

Tidak termasuk MVP.

- AI-powered article summarization.
- AI topic classification.
- Sentiment analysis.
- Competitor intelligence.
- Similar article detection.
- Automatic source discovery.
- Multi-user workspaces.
- Team collaboration.
- Slack, Telegram, dan Discord integration.
- Webhook integration.
- Advanced analytics.
- Custom reports.
- API access.
- White-label dashboard.
- Enterprise monitoring.
- Semantic search.
- LLM-based intelligence reports.

## 5.4 MVP Scope Decision

MVP hanya menggunakan RSS dan Atom Feed.

Jangan membangun general-purpose web scraper.

Alasannya:

1. Struktur website sangat beragam.
2. Website dapat menggunakan JavaScript rendering.
3. Scraping meningkatkan risiko pemblokiran.
4. RSS lebih terstruktur.
5. RSS lebih mudah di-maintain.
6. Penggunaan resource lebih rendah.

Jika suatu website tidak menyediakan RSS, pengguna belum dapat menambahkan website tersebut sebagai sumber langsung pada MVP.

---

# 6. FUNCTIONAL REQUIREMENTS

## FR-01 — User Authentication

**Description:** Pengguna dapat membuat akun dan mengakses dashboard.

Behavior:

- Register menggunakan email dan password.
- Login menggunakan Supabase Auth.
- Logout mengakhiri session.
- Route dashboard dilindungi authentication.
- Setiap data memiliki ownership pengguna.

Acceptance Criteria:

- Pengguna dapat register.
- Pengguna dapat login.
- Pengguna tidak dapat mengakses dashboard tanpa authentication.
- Pengguna tidak dapat mengakses data milik pengguna lain.
- Logout mengakhiri session dengan benar.

## FR-02 — Dashboard

**Description:** Menampilkan ringkasan aktivitas RSSFusion.

Behavior:

Dashboard menampilkan:

- Total sources.
- Total articles.
- Total topics.
- Total saved articles.
- Latest articles.
- Recent activity.

Acceptance Criteria:

- Statistik berasal dari database.
- Dashboard menampilkan empty state jika belum ada data.
- Dashboard menampilkan loading state.
- Dashboard menampilkan error state jika API gagal.

## FR-03 — RSS Source Management

**Description:** Pengguna dapat mengelola RSS sources.

Behavior:

- Menambahkan RSS URL.
- Memvalidasi RSS.
- Menyimpan source.
- Melihat daftar sources.
- Mengaktifkan atau menonaktifkan source.
- Menghapus source.

Data yang disimpan:

- Source name.
- Feed URL.
- Website URL.
- Description.
- Last fetched time.
- Last successful fetch.
- Fetch status.
- Enabled status.

Acceptance Criteria:

- URL harus valid.
- URL harus menghasilkan RSS atau Atom Feed yang dapat diparsing.
- Feed yang tidak valid ditolak dengan pesan jelas.
- Source milik pengguna lain tidak dapat diakses.
- Source yang disabled tidak di-fetch worker.

## FR-04 — RSS Background Fetching

**Description:** Sistem mengambil artikel secara otomatis.

Behavior:

1. Worker mengambil daftar RSS sources aktif.
2. Worker memeriksa jadwal fetching.
3. Worker melakukan HTTP request.
4. Worker mem-parsing RSS/Atom.
5. Worker menormalisasi data.
6. Worker memeriksa duplikasi.
7. Worker menyimpan artikel baru.
8. Worker memperbarui status source.

Acceptance Criteria:

- Worker berjalan terpisah dari Next.js.
- Fetching tidak bergantung pada request browser.
- Error satu source tidak menghentikan seluruh worker.
- Feed dapat diproses kembali setelah error.
- Worker tidak menghasilkan duplikasi.
- Setiap fetch tercatat dalam log.

## FR-05 — Article Management

**Description:** Sistem menyimpan metadata artikel.

Data artikel:

- Title.
- Canonical URL.
- Original URL.
- Description.
- Author.
- Published date.
- Image URL.
- Content snippet.
- Source ID.
- GUID.

Acceptance Criteria:

- Artikel dapat ditampilkan di dashboard.
- Artikel memiliki sumber yang jelas.
- Artikel dapat dibuka melalui original URL.
- Artikel diurutkan berdasarkan waktu publikasi.
- Artikel tanpa published date memiliki fallback timestamp.
- Data artikel tidak disimpan berulang.

## FR-06 — Topic Management

**Description:** Pengguna dapat membuat topik.

Behavior:

- Membuat topik.
- Mengubah nama topik.
- Menghapus topik.
- Menambahkan keyword ke topik.
- Melihat artikel yang cocok dengan topik.

Acceptance Criteria:

- Topik memiliki ownership pengguna.
- Nama topik wajib diisi.
- Topik dapat memiliki beberapa keyword.
- Pengguna tidak dapat mengakses topik pengguna lain.

## FR-07 — Keyword Monitoring

**Description:** Pengguna dapat memantau keyword tertentu.

Behavior:

- Menambahkan keyword.
- Mengubah keyword.
- Menghapus keyword.
- Menghubungkan keyword ke topik.
- Sistem mencocokkan keyword dengan judul dan deskripsi artikel.

MVP Matching Rules:

- Case-insensitive.
- Unicode-normalized.
- Exact phrase matching.
- Matching pada title dan description.
- Matching pada content snippet apabila tersedia.
- Tidak menggunakan AI.

Acceptance Criteria:

- Keyword dapat disimpan.
- Matching menghasilkan hubungan artikel dan keyword.
- Satu artikel dapat cocok dengan beberapa keyword.
- Matching tidak membuat duplicate relations.
- Matching dilakukan ketika artikel baru diproses.

## FR-08 — Article Feed

**Description:** Menampilkan seluruh artikel yang relevan dengan pengguna.

Behavior:

- Menampilkan artikel terbaru.
- Filter berdasarkan source.
- Filter berdasarkan topic.
- Filter berdasarkan keyword.
- Filter berdasarkan tanggal.
- Pagination.

Acceptance Criteria:

- Artikel hanya berasal dari sumber yang diikuti pengguna.
- Filter dapat digunakan bersamaan.
- Pagination tidak menampilkan artikel berulang.
- Default sorting terbaru terlebih dahulu.

## FR-09 — Search

**Description:** Pengguna dapat mencari artikel.

Behavior:

- Search berdasarkan judul.
- Search berdasarkan description.
- Filter berdasarkan tanggal.
- Filter berdasarkan source.
- Filter berdasarkan topic.

Acceptance Criteria:

- Search berjalan melalui database.
- Input divalidasi.
- Query tidak menyebabkan SQL injection.
- Hasil dibatasi dengan pagination.

## FR-10 — Saved Articles

**Description:** Pengguna dapat menyimpan artikel penting.

Behavior:

- Save article.
- Unsave article.
- Melihat daftar saved articles.

Acceptance Criteria:

- Artikel dapat disimpan satu kali per pengguna.
- Pengguna hanya melihat saved articles miliknya.
- Unsave tidak menghapus artikel global.

## FR-11 — Automatic Scheduling

**Description:** Worker berjalan secara berkala.

Behavior:

- Scheduler memeriksa sumber yang waktunya telah tiba.
- Source memiliki next_fetch_at.
- Source dapat memiliki interval fetching.
- Worker mengambil pekerjaan yang tersedia.

Acceptance Criteria:

- Scheduler berjalan otomatis.
- Fetch interval dapat dikonfigurasi.
- Tidak terjadi pemrosesan ganda secara bersamaan.
- Worker dapat dilanjutkan setelah restart.

## FR-12 — Feed Health Monitoring

**Description:** Sistem mencatat kondisi RSS source.

Behavior:

- Menyimpan last fetched time.
- Menyimpan last successful fetch.
- Menyimpan error terakhir.
- Menghitung consecutive failures.

Acceptance Criteria:

- Status source diperbarui setelah fetch.
- Error dapat dilihat pengguna.
- Source bermasalah tidak menghentikan source lainnya.

## FR-13 — Quota Management

**Description:** Sistem membatasi penggunaan berdasarkan paket.

MVP limits:

| Plan     | RSS Sources  | Keywords     | Topics       |
| -------- | ------------ | ------------ | ------------ |
| Free     | 5            | 3            | 3            |
| Starter  | 30           | 20           | 20           |
| Pro      | 100          | 100          | 100          |
| Business | Configurable | Configurable | Configurable |

Catatan:

- Topics adalah entitas terpisah dari keyword.
- Quota diterapkan pada backend.
- Pengguna tidak dapat melewati quota dengan memanggil API secara langsung.
- MVP dapat menggunakan Free plan saja dengan struktur database yang sudah mendukung plan lainnya.
- Payment integration tidak termasuk MVP.

Acceptance Criteria:

- Quota diperiksa sebelum insert.
- Pengguna mendapatkan pesan ketika quota tercapai.
- Frontend menampilkan penggunaan quota.

## FR-14 — Email Notification

**Priority:** P1.

Behavior:

- Pengguna dapat mengaktifkan email notification.
- Sistem mendeteksi artikel baru yang cocok dengan keyword.
- Notification disimpan ke queue.
- Email dikirim melalui provider.

Acceptance Criteria:

- Email tidak dikirim berulang untuk event yang sama.
- Pengguna dapat menonaktifkan notifikasi.
- Email delivery dicatat.

## FR-15 — Trend Analysis

**Priority:** P1.

Behavior:

- Menghitung jumlah artikel berdasarkan topik.
- Mengelompokkan berdasarkan hari atau minggu.
- Menampilkan grafik perkembangan publikasi.

Acceptance Criteria:

- Data berasal dari artikel yang tersimpan.
- Rentang waktu dapat dipilih.
- Grafik menampilkan empty state jika tidak ada data.

---

# 7. NON-FUNCTIONAL REQUIREMENTS

## 7.1 Performance

- Dashboard menggunakan pagination.
- API tidak mengambil seluruh artikel sekaligus.
- Database memiliki index yang sesuai.
- RSS fetching berjalan asynchronous.
- Worker memiliki batas concurrency.
- Hindari N+1 database queries.
- Gunakan server-side filtering.

Target awal:

| Component       | Target                         |
| --------------- | ------------------------------ |
| Dashboard API   | P95 < 500 ms                   |
| Article listing | P95 < 700 ms                   |
| Search          | P95 < 700 ms                   |
| RSS worker      | Configurable concurrency       |
| UI initial load | Optimized for common broadband |

Target response time tidak termasuk waktu jaringan eksternal atau cold start provider.

## 7.2 Reliability

- Worker harus dapat restart tanpa kehilangan pekerjaan.
- Feed error harus terisolasi.
- Database transaction digunakan pada operasi kritis.
- Deduplication harus dijamin database.
- Job processing harus aman terhadap retry.

## 7.3 Security

- Supabase Row Level Security.
- Server-side authentication.
- Input validation menggunakan Zod.
- API authorization.
- Rate limiting.
- SSRF protection untuk RSS URL.
- Environment variables untuk secrets.
- HTTPS pada production.

## 7.4 Maintainability

- TypeScript strict mode.
- Reusable components.
- Business logic terpisah dari UI.
- Database schema menggunakan migration.
- Service memiliki tanggung jawab jelas.
- Hindari abstraction yang tidak dibutuhkan.

## 7.5 Scalability

Arsitektur MVP mendukung pertumbuhan melalui:

- Worker concurrency control.
- Database indexing.
- Queue berbasis PostgreSQL.
- Pagination.
- Feed scheduling.
- Penggunaan connection pooling.
- Worker scaling pada VPS yang lebih besar.

Redis dan BullMQ dapat ditambahkan jika PostgreSQL-backed job processing tidak lagi mencukupi.

## 7.6 Compatibility

- Chrome.
- Edge.
- Firefox.
- Safari.
- Desktop.
- Tablet.
- Mobile.

## 7.7 Privacy

- Pengguna hanya mengakses data miliknya.
- Artikel publik tidak otomatis menjadi milik eksklusif pengguna.
- Artikel disimpan sebagai metadata dan link.
- Konten lengkap hanya disimpan apabila diperlukan dan diizinkan.
- Pengguna dapat menghapus account dan data personalnya.

---

# 8. APPLICATION STRUCTURE & NAVIGATION

## 8.1 Public Routes

| Route       | Description      |
| ----------- | ---------------- |
| `/`         | Landing page     |
| `/pricing`  | Pricing          |
| `/login`    | Login            |
| `/register` | Registration     |
| `/privacy`  | Privacy policy   |
| `/terms`    | Terms of service |

## 8.2 Protected Routes

| Route                 | Description        |
| --------------------- | ------------------ |
| `/dashboard`          | Dashboard overview |
| `/dashboard/articles` | All articles       |
| `/dashboard/sources`  | RSS sources        |
| `/dashboard/topics`   | Topics             |
| `/dashboard/keywords` | Keyword management |
| `/dashboard/saved`    | Saved articles     |
| `/dashboard/settings` | User settings      |

P1 routes:

- `/dashboard/analytics`
- `/dashboard/notifications`
- `/dashboard/billing`

## 8.3 Navigation

Sidebar:

1. Overview
2. Articles
3. Sources
4. Topics
5. Keywords
6. Saved Articles
7. Analytics (P1)
8. Settings

## 8.4 Layout Structure

Public Layout:

- Navbar.
- Main content.
- Footer.

Dashboard Layout:

- Sidebar.
- Topbar.
- Main content.
- User menu.
- Responsive navigation drawer.

## 8.5 Reusable Components

- AppSidebar.
- DashboardHeader.
- ArticleCard.
- ArticleList.
- ArticleFilters.
- ArticleSearch.
- SourceCard.
- SourceForm.
- SourceStatusBadge.
- TopicCard.
- TopicForm.
- KeywordInput.
- SavedArticleButton.
- StatCard.
- EmptyState.
- ErrorState.
- LoadingSkeleton.
- Pagination.
- ConfirmDialog.

---

# 9. USER FLOW

## 9.1 First-Time User

```
Landing Page
    |
    v
Register
    |
    v
Email Verification (if enabled)
    |
    v
Login
    |
    v
Dashboard
    |
    v
Onboarding
    |
    v
Add First RSS Source
    |
    v
Validate RSS
    |
    v
Save Source
    |
    v
Create First Topic
    |
    v
Add Keywords
    |
    v
Worker Fetches Articles
    |
    v
Articles Appear
    |
    v
Read / Save / Search
```

## 9.2 Add RSS Source

1. Open Sources.
2. Click Add Source.
3. Enter RSS URL.
4. Click Validate.
5. System fetches and parses feed.
6. Display feed preview.
7. User confirms.
8. Source is saved.
9. Worker schedules next fetch.

## 9.3 Create Topic

1. Open Topics.
2. Click Create Topic.
3. Enter topic name.
4. Add one or more keywords.
5. Save.
6. System matches existing articles.
7. New matching articles are automatically linked.

## 9.4 Read and Save Article

1. Open Articles.
2. Search or filter.
3. Open article detail or original URL.
4. Click Save.
5. Article appears in Saved Articles.

---

# 10. UI/UX REQUIREMENTS

## 10.1 Design Direction

Design style:

**Modern Information Dashboard**

Visual references:

- Feedly.
- Linear.
- Notion.
- Readwise Reader.
- Modern SaaS analytics dashboard.

Design characteristics:

- Clean.
- Minimal.
- Information-dense but readable.
- Professional.
- Consistent spacing.
- Clear visual hierarchy.

## 10.2 Color System

Suggested palette:

| Token          | Color      |
| -------------- | ---------- |
| Primary        | Indigo     |
| Secondary      | Slate      |
| Background     | Neutral 50 |
| Surface        | White      |
| Text Primary   | Slate 900  |
| Text Secondary | Slate 500  |
| Success        | Green      |
| Warning        | Amber      |
| Error          | Red        |

Implement design tokens through CSS variables.

## 10.3 Typography

Recommended:

- Inter or Geist.
- Clear heading hierarchy.
- Comfortable article reading width.
- Minimum readable body text.

## 10.4 Dashboard Layout

Desktop:

- Sidebar approximately 240px.
- Topbar.
- Main content.
- Article list as primary content.

Mobile:

- Collapsible navigation.
- Single-column article list.
- Responsive filters.
- Touch-friendly buttons.

## 10.5 Article Card

Setiap ArticleCard menampilkan:

- Article title.
- Source name.
- Published date.
- Description.
- Topic tags.
- Save button.
- External link.

Image bersifat optional karena tidak semua RSS menyediakan gambar.

## 10.6 UI States

Setiap fitur wajib memiliki:

**Loading State**

- Skeleton.
- Spinner untuk operasi singkat.

**Empty State**

- Belum ada sumber.
- Belum ada artikel.
- Belum ada topik.
- Belum ada saved articles.

**Error State**

- Pesan yang mudah dipahami.
- Retry action jika relevan.

**Success State**

- Toast notification.
- Form reset jika sesuai.

**Disabled State**

- Tombol disabled ketika request berlangsung.
- Quota-exceeded state.

## 10.7 Accessibility

- Semantic HTML.
- Keyboard navigation.
- Visible focus state.
- Form labels.
- ARIA attributes apabila dibutuhkan.
- Kontras warna memadai.

---

# 11. ERROR HANDLING

| Error                | Cause                | System Response                 |
| -------------------- | -------------------- | ------------------------------- |
| Invalid RSS URL      | URL salah            | Tampilkan validation error      |
| Invalid XML          | Feed rusak           | Tandai source error             |
| HTTP 404             | Feed tidak ditemukan | Catat error                     |
| HTTP 429             | Rate limit source    | Retry dengan backoff            |
| HTTP 500             | Server source error  | Retry pada jadwal berikutnya    |
| Timeout              | Source lambat        | Abort request dan catat error   |
| Duplicate Article    | Artikel sudah ada    | Skip insert                     |
| Authentication Error | Session invalid      | Redirect login                  |
| Authorization Error  | Bukan pemilik data   | Return 403 atau 404             |
| Database Error       | Database gagal       | Return safe error dan log       |
| Quota Exceeded       | Melebihi paket       | Tolak insert                    |
| Worker Failure       | Worker crash         | Restart melalui process manager |
| Email Failure        | Provider error       | Simpan failed status            |
| Rate Limited         | Request berlebihan   | Return 429                      |

## 11.1 Error Response Format

Gunakan format konsisten:

```
type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
      };
    };
```

Jangan mengirim stack trace atau informasi sensitif ke client.

---

# 12. TECHNICAL ARCHITECTURE

## 12.1 Architecture Decision

RSSFusion menggunakan:

**Next.js Modular Monolith + Dedicated Background Worker.**

Alasannya:

- Next.js cocok untuk UI dan API.
- Supabase menyediakan managed PostgreSQL dan Auth.
- RSS fetching membutuhkan proses asynchronous.
- Worker harus berjalan secara persisten.
- Serverless Functions tidak ideal untuk scheduler dan proses fetching yang berjalan terus-menerus.

## 12.2 High-Level Architecture

```
                    INTERNET
                       |
                       v
                NEXT.JS APPLICATION
                 (Vercel Hosting)
                       |
             +---------+---------+
             |                   |
             v                   v
        SERVER COMPONENTS   ROUTE HANDLERS
             |                   |
             +---------+---------+
                       |
                       v
               SUPABASE SERVICES
                       |
             +---------+---------+
             |                   |
             v                   v
       POSTGRESQL DATABASE   SUPABASE AUTH
             |
             |
      +------+----------------------+
      |                             |
      v                             v
  RSS WORKER                  NOTIFICATION JOBS
  (VPS / Node.js)                  |
      |                            v
      v                       EMAIL PROVIDER
  FEED SCHEDULER
      |
      v
  RSS HTTP FETCHER
      |
      v
  RSS PARSER
      |
      v
  NORMALIZATION
      |
      v
  DEDUPLICATION
      |
      v
  ARTICLE STORAGE
      |
      v
  KEYWORD MATCHING
```

## 12.3 Presentation Layer

Technology:

- Next.js App Router.
- React.
- Tailwind CSS.
- shadcn/ui.

Responsibilities:

- Render dashboard.
- Display article list.
- Display forms.
- Handle user interaction.
- Display loading and error states.

Presentation layer tidak boleh mengandung RSS fetching logic.

## 12.4 Application Layer

Responsibilities:

- Authentication validation.
- API orchestration.
- Request validation.
- Application use cases.
- Response formatting.

Contoh use cases:

- CreateSource.
- DeleteSource.
- GetArticles.
- CreateTopic.
- CreateKeyword.
- SaveArticle.
- GetDashboardStats.

## 12.5 Business Logic Layer

Responsibilities:

- Feed validation.
- Article normalization.
- Article deduplication.
- Keyword matching.
- Quota validation.
- Source scheduling rules.

Business logic tidak boleh bergantung langsung pada React components.

## 12.6 Data Access Layer

Responsibilities:

- Database queries.
- Insert.
- Update.
- Delete.
- Pagination.
- Transactional operations.

Gunakan repository/service sederhana apabila dibutuhkan.

Jangan membuat abstraksi repository untuk setiap tabel apabila tidak memberi manfaat.

## 12.7 Infrastructure Layer

Responsibilities:

- Supabase client.
- RSS parser.
- HTTP fetcher.
- Background worker.
- Scheduler.
- Email provider.
- Logging.

## 12.8 Backend Responsibilities

Next.js Route Handlers:

- Authentication-related API.
- Source CRUD.
- Topic CRUD.
- Keyword CRUD.
- Article queries.
- Saved article operations.
- Dashboard statistics.
- Quota checks.

Dedicated Worker:

- Scheduled RSS fetching.
- Feed parsing.
- Article normalization.
- Deduplication.
- Keyword matching.
- Notification processing.

Worker tidak perlu membuat REST API sendiri pada MVP.

## 12.9 RSS Worker Architecture

Worker merupakan aplikasi Node.js TypeScript terpisah di dalam repository yang sama.

Struktur:

```
worker/
├── src/
│   ├── index.ts
│   ├── config/
│   │   └── env.ts
│   ├── jobs/
│   │   ├── fetch-feeds.ts
│   │   └── process-notifications.ts
│   ├── services/
│   │   ├── feed-fetcher.ts
│   │   ├── feed-parser.ts
│   │   ├── article-normalizer.ts
│   │   ├── article-deduplicator.ts
│   │   └── keyword-matcher.ts
│   ├── repositories/
│   │   ├── source-repository.ts
│   │   └── article-repository.ts
│   └── utils/
│       ├── logger.ts
│       └── retry.ts
├── package.json
└── tsconfig.json
```

## 12.10 Scheduling Strategy

MVP menggunakan PostgreSQL sebagai scheduling store.

Setiap RSS source memiliki:

- last_fetched_at.
- next_fetch_at.
- consecutive_failures.
- fetch_interval_minutes.
- enabled.

Worker menjalankan polling interval, misalnya setiap 30–60 detik.

Worker mengambil pekerjaan menggunakan PostgreSQL row locking dengan `FOR UPDATE SKIP LOCKED`.

Konsep:

```
BEGIN;

SELECT id
FROM rss_sources
WHERE enabled = true
  AND next_fetch_at <= NOW()
  AND (locked_until IS NULL OR locked_until < NOW())
ORDER BY next_fetch_at
LIMIT 10
FOR UPDATE SKIP LOCKED;

-- Claim selected jobs.
-- Set locked_until and increment attempt metadata.

COMMIT;
```

Implementasi aktual harus mengembalikan ID pekerjaan yang berhasil di-claim menggunakan `UPDATE ... RETURNING`.

Ketentuan:

- Gunakan lock expiration.
- Jangan menahan transaction selama HTTP fetch.
- Fetch dilakukan setelah claim selesai.
- Setelah berhasil, perbarui next_fetch_at.
- Setelah gagal, gunakan exponential backoff.
- Worker dapat mengambil ulang pekerjaan dengan lock yang kedaluwarsa.

Redis dan BullMQ belum diperlukan pada MVP.

## 12.11 RSS Fetching Strategy

Gunakan:

- `rss-parser`.
- Native Node.js fetch atau HTTP client yang diperlukan.
- Timeout.
- Conditional requests.
- User-Agent yang informatif.
- Concurrency limit.
- Exponential backoff.

HTTP optimizations:

- Gunakan ETag jika tersedia.
- Gunakan Last-Modified jika tersedia.
- Kirim If-None-Match.
- Kirim If-Modified-Since.
- Tangani HTTP 304 tanpa mem-parsing ulang konten.
- Hindari fetching berulang jika tidak diperlukan.

## 12.12 Article Deduplication

Prioritas identifikasi artikel:

1. Source ID + normalized GUID.
2. Source ID + canonical URL.
3. Source ID + normalized original URL sebagai fallback.

Gunakan database unique constraint.

Jangan mengandalkan pengecekan aplikasi saja karena dua worker dapat memproses artikel bersamaan.

## 12.13 Keyword Matching

MVP menggunakan matching berbasis teks.

Contoh:

```
interface KeywordMatchInput {
  title: string;
  description?: string;
  snippet?: string;
  keywords: string[];
}
```

Proses:

1. Normalize Unicode.
2. Convert ke lowercase.
3. Gabungkan title dan description.
4. Cari exact phrase.
5. Simpan hasil matching.
6. Hindari relasi duplikat.

Untuk MVP, jangan menggunakan LLM sebagai dependency wajib.

## 12.14 Recommended Technology Stack

| Technology          | Purpose              | Decision               |
| ------------------- | -------------------- | ---------------------- |
| Next.js             | Frontend + API       | Required               |
| TypeScript          | Application language | Required               |
| Tailwind CSS        | Styling              | Required               |
| shadcn/ui           | UI components        | Required               |
| Supabase PostgreSQL | Database             | Required               |
| Supabase Auth       | Authentication       | Required               |
| rss-parser          | RSS/Atom parsing     | Required               |
| Zod                 | Validation           | Required               |
| Zustand             | Client state         | Optional               |
| Axios               | HTTP requests        | Not required initially |
| TanStack Query      | Server state         | Optional               |
| Redis               | Job queue            | Future                 |
| BullMQ              | Job queue            | Future                 |
| Resend              | Email                | P1                     |
| Recharts            | Analytics charts     | P1                     |
| Vitest              | Unit testing         | Recommended            |
| Playwright          | E2E testing          | Recommended            |

## 12.15 Deployment Architecture

Production:

| Component      | Hosting                    |
| -------------- | -------------------------- |
| Next.js Web    | Vercel                     |
| PostgreSQL     | Supabase                   |
| Authentication | Supabase Auth              |
| RSS Worker     | VPS                        |
| Scheduler      | Worker process             |
| Email          | Resend or equivalent       |
| Domain         | Custom domain              |
| DNS            | DNS provider               |
| HTTPS          | Vercel + VPS reverse proxy |

Worker deployment:

- Ubuntu VPS.
- Node.js LTS.
- PM2 or systemd.
- Environment variables.
- Automatic restart.
- Structured logs.

Docker bersifat opsional. Gunakan hanya jika membantu deployment atau reproducibility.

## 12.16 Architecture Constraints

Jangan:

- Menjalankan scheduler di React.
- Menjalankan RSS fetch hanya saat pengguna membuka dashboard.
- Menjalankan worker melalui Vercel serverless cron sebagai long-running worker.
- Mengambil seluruh RSS source dalam satu HTTP request.
- Menggunakan satu global queue tanpa ownership dan locking.
- Menyimpan seluruh artikel lengkap tanpa kebutuhan.
- Menjalankan scraping arbitrer terhadap semua website.

---

# 13. DATA MODEL

## 13.1 Database Overview

Database utama: PostgreSQL.

Authentication: Supabase Auth.

Seluruh tabel user-owned harus memiliki user_id dan Row Level Security yang sesuai.

## 13.2 Tables

### profiles

| Column     | Type        | Description           |
| ---------- | ----------- | --------------------- |
| id         | UUID        | References auth.users |
| full_name  | TEXT        | User name             |
| avatar_url | TEXT        | Avatar                |
| plan       | TEXT        | Subscription plan     |
| created_at | TIMESTAMPTZ | Created               |
| updated_at | TIMESTAMPTZ | Updated               |

### rss_sources

| Column                 | Type        | Description        |
| ---------------------- | ----------- | ------------------ |
| id                     | UUID        | Primary key        |
| user_id                | UUID        | Owner              |
| name                   | TEXT        | Source name        |
| feed_url               | TEXT        | RSS URL            |
| site_url               | TEXT        | Website URL        |
| description            | TEXT        | Description        |
| enabled                | BOOLEAN     | Enabled status     |
| last_fetched_at        | TIMESTAMPTZ | Last attempt       |
| last_success_at        | TIMESTAMPTZ | Last success       |
| next_fetch_at          | TIMESTAMPTZ | Scheduled time     |
| fetch_interval_minutes | INTEGER     | Fetch interval     |
| consecutive_failures   | INTEGER     | Failure count      |
| locked_until           | TIMESTAMPTZ | Worker lock        |
| last_error             | TEXT        | Last error         |
| etag                   | TEXT        | HTTP ETag          |
| last_modified          | TEXT        | HTTP Last-Modified |
| created_at             | TIMESTAMPTZ | Created            |
| updated_at             | TIMESTAMPTZ | Updated            |

### articles

Artikel merupakan data global berdasarkan source. Akses kepada artikel harus tetap melalui sumber yang diikuti pengguna.

| Column          | Type        | Description      |
| --------------- | ----------- | ---------------- |
| id              | UUID        | Primary key      |
| source_id       | UUID        | RSS source       |
| guid            | TEXT        | Feed GUID        |
| canonical_url   | TEXT        | Normalized URL   |
| original_url    | TEXT        | Original URL     |
| title           | TEXT        | Title            |
| description     | TEXT        | Description      |
| content_snippet | TEXT        | Optional snippet |
| author          | TEXT        | Author           |
| image_url       | TEXT        | Optional image   |
| published_at    | TIMESTAMPTZ | Publication date |
| fetched_at      | TIMESTAMPTZ | Fetch date       |
| created_at      | TIMESTAMPTZ | Created          |

Unique constraints:

- source_id + guid, when GUID exists.
- source_id + canonical_url.

Implementasi harus menangani GUID kosong dan URL yang tidak tersedia dengan fallback yang aman.

### topics

| Column      | Type        | Description |
| ----------- | ----------- | ----------- |
| id          | UUID        | Primary key |
| user_id     | UUID        | Owner       |
| name        | TEXT        | Topic name  |
| description | TEXT        | Description |
| created_at  | TIMESTAMPTZ | Created     |
| updated_at  | TIMESTAMPTZ | Updated     |

### keywords

| Column     | Type        | Description    |
| ---------- | ----------- | -------------- |
| id         | UUID        | Primary key    |
| user_id    | UUID        | Owner          |
| topic_id   | UUID        | Optional topic |
| keyword    | TEXT        | Keyword        |
| enabled    | BOOLEAN     | Active         |
| created_at | TIMESTAMPTZ | Created        |

### article_keyword_matches

| Column     | Type        | Description |
| ---------- | ----------- | ----------- |
| id         | UUID        | Primary key |
| article_id | UUID        | Article     |
| keyword_id | UUID        | Keyword     |
| matched_at | TIMESTAMPTZ | Match date  |

Unique constraint:

- article_id + keyword_id.

### saved_articles

| Column     | Type        | Description |
| ---------- | ----------- | ----------- |
| id         | UUID        | Primary key |
| user_id    | UUID        | Owner       |
| article_id | UUID        | Article     |
| created_at | TIMESTAMPTZ | Created     |

Unique constraint:

- user_id + article_id.

### article_read_status

| Column     | Type        | Description |
| ---------- | ----------- | ----------- |
| id         | UUID        | Primary key |
| user_id    | UUID        | Owner       |
| article_id | UUID        | Article     |
| read_at    | TIMESTAMPTZ | Read date   |

Unique constraint:

- user_id + article_id.

### feed_fetch_logs

| Column            | Type        | Description      |
| ----------------- | ----------- | ---------------- |
| id                | UUID        | Primary key      |
| source_id         | UUID        | Source           |
| status            | TEXT        | success / failed |
| http_status       | INTEGER     | HTTP status      |
| articles_found    | INTEGER     | Parsed articles  |
| articles_inserted | INTEGER     | New articles     |
| error_message     | TEXT        | Error            |
| duration_ms       | INTEGER     | Duration         |
| created_at        | TIMESTAMPTZ | Created          |

## 13.3 P1 Tables

### notification_preferences

- id.
- user_id.
- email_enabled.
- digest_frequency.
- created_at.

### notification_logs

- id.
- user_id.
- article_id.
- channel.
- status.
- sent_at.
- error_message.

### article_topics

Digunakan jika satu artikel dapat diklasifikasikan ke beberapa topic secara eksplisit pada pengembangan lanjutan.

## 13.4 Database Relationships

```
auth.users
    |
    +---- profiles
    |
    +---- rss_sources
    |         |
    |         +---- articles
    |                   |
    |                   +---- article_keyword_matches
    |                   |
    |                   +---- saved_articles
    |                   |
    |                   +---- article_read_status
    |
    +---- topics
    |         |
    |         +---- keywords
    |                    |
    |                    +---- article_keyword_matches
    |
    +---- notification_preferences
```

## 13.5 Important Database Rules

1. Semua UUID menggunakan UUID type.
2. Foreign key harus memiliki on-delete behavior yang jelas.
3. Tambahkan index pada user_id.
4. Tambahkan index pada source_id.
5. Tambahkan index pada published_at.
6. Tambahkan index pada next_fetch_at.
7. Tambahkan unique constraint untuk deduplication.
8. Gunakan TIMESTAMPTZ.
9. Gunakan migration untuk setiap perubahan schema.
10. Jangan menjalankan query database langsung dari Client Components.

## 13.6 Data Retention

MVP:

- Artikel disimpan selama masih dibutuhkan produk.
- Feed logs dapat dibersihkan setelah periode retensi tertentu, misalnya 30 hari.
- User deletion menghapus data personal pengguna.
- Artikel global dapat dipertahankan apabila masih digunakan pengguna lain.

---

# 14. SECURITY & PRIVACY

## 14.1 Authentication

Gunakan Supabase Auth.

- Server-side session validation.
- Middleware untuk proteksi halaman bila diperlukan.
- Jangan mengandalkan client-side authentication saja.

## 14.2 Authorization

Gunakan PostgreSQL Row Level Security.

Contoh:

```
ALTER TABLE rss_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own sources"
ON rss_sources
FOR SELECT
USING (auth.uid() = user_id);
```

Buat policy terpisah untuk INSERT, UPDATE, dan DELETE.

Artikel global tidak boleh diekspos tanpa validasi bahwa pengguna memiliki akses terhadap source terkait.

## 14.3 RSS URL Security — SSRF Protection

Ini merupakan bagian keamanan yang sangat penting.

Karena pengguna dapat memasukkan URL RSS sendiri, sistem harus mencegah SSRF.

Aturan:

- Hanya izinkan HTTP dan HTTPS.
- Tolak localhost.
- Tolak private IPv4.
- Tolak private IPv6.
- Tolak link-local address.
- Tolak cloud metadata endpoints.
- Validasi DNS resolution.
- Revalidate setiap redirect.
- Batasi jumlah redirect.
- Batasi response size.
- Batasi request timeout.
- Jangan meneruskan credential internal.
- Gunakan outbound network restrictions jika tersedia.

Jangan menganggap validasi URL menggunakan regex saja sudah cukup.

## 14.4 Rate Limiting

Terapkan rate limit pada:

- Login.
- Register.
- Add source.
- Manual refresh.
- Search API.
- Public endpoints.

## 14.5 Environment Variables

Contoh:

```
# Next.js
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Worker
WORKER_DATABASE_URL=
WORKER_POLL_INTERVAL_MS=30000
WORKER_CONCURRENCY=5
WORKER_FETCH_TIMEOUT_MS=15000
WORKER_USER_AGENT=RSSFusionBot/1.0

# Optional Email
RESEND_API_KEY=
```

Catatan:

- Jangan menggunakan service role key di browser.
- Database URL worker hanya tersedia di environment worker.
- Jangan commit `.env`.
- Gunakan Supabase connection pooling jika sesuai kebutuhan worker.
- Untuk worker yang memerlukan direct PostgreSQL access, pilih koneksi yang sesuai dengan deployment Supabase.

## 14.6 Data Privacy

- Jangan menyimpan password sendiri.
- Jangan mengumpulkan informasi pengguna yang tidak diperlukan.
- Jangan membagikan data private antar pengguna.
- Sediakan account deletion.
- Sediakan privacy policy dan terms of service.

---

# 15. SUCCESS CRITERIA

MVP dinyatakan berhasil apabila:

1. User dapat register dan login.
2. User dapat menambahkan RSS source.
3. Feed validation berfungsi.
4. Worker dapat berjalan otomatis.
5. Artikel dapat di-fetch.
6. Artikel tidak terduplikasi.
7. Artikel tersimpan ke PostgreSQL.
8. Keyword dapat dibuat.
9. Keyword matching berjalan.
10. Dashboard menampilkan artikel.
11. Search dan filter berfungsi.
12. Saved articles berfungsi.
13. Ownership dan RLS berjalan.
14. Quota Free diterapkan.
15. Web application dapat diakses production.
16. Worker berjalan stabil pada VPS.
17. Logging tersedia.
18. Backup database dikonfigurasi.

---

# 16. RISKS & TECHNICAL CONSTRAINTS

| Risk                            | Impact                  | Mitigation                |
| ------------------------------- | ----------------------- | ------------------------- |
| RSS source unavailable          | Missing articles        | Retry and source health   |
| RSS structure varies            | Parsing errors          | Parser validation         |
| Duplicate articles              | Data pollution          | Unique constraints        |
| SSRF attacks                    | Security vulnerability  | URL/IP validation         |
| Excessive fetching              | Resource consumption    | Scheduling and rate limit |
| Worker crash                    | Delayed updates         | Process manager           |
| Database connection exhaustion  | Application downtime    | Connection pooling        |
| Feed content changes            | Parsing inconsistencies | Normalization             |
| Large feeds                     | Memory usage            | Response limits           |
| Email provider failure          | Notification delay      | Retry queue               |
| Rapid user growth               | Infrastructure load     | Monitoring and scaling    |
| Third-party source restrictions | Legal/reliability risk  | Respect source policies   |

## 16.1 Important Product Limitations

RSSFusion tidak menjamin seluruh artikel dari suatu website dapat ditemukan.

Keberhasilan pengumpulan informasi bergantung pada:

- Ketersediaan RSS.
- Frekuensi publikasi source.
- Kualitas feed.
- Kebijakan server source.
- Network availability.

RSSFusion juga bukan pengganti sistem crawling internet secara menyeluruh.

---

# PART B — SEQUENTIAL DEVELOPMENT PLAYBOOK

# DEVELOPMENT EXECUTION RULES

Development dilakukan dalam tepat 10 phase.

Setiap phase harus:

1. Dibaca dan dipahami.
2. Dikerjakan secara independen.
3. Diverifikasi.
4. Diuji.
5. Direview.
6. Di-commit ke Git.
7. Disetujui sebelum melanjutkan.

AI Coding Assistant dilarang mengerjakan phase selanjutnya secara otomatis.

---

# PHASE 1 — ENVIRONMENT & PROJECT BOOTSTRAP

## 1. Phase Objective

Mempersiapkan development environment dan membuat fondasi project RSSFusion.

Pada tahap ini belum ada business logic RSS.

## 2. Scope of Work

- Install dan verifikasi Node.js.
- Setup Next.js.
- Setup TypeScript.
- Setup Tailwind CSS.
- Setup shadcn/ui.
- Setup ESLint.
- Setup Git.
- Setup environment variables.
- Setup basic folder structure.
- Verifikasi project dapat dijalankan.

## 3. Detailed Implementation Steps

### Step 1 — Verify Environment

Periksa:

```
node --version
npm --version
git --version
```

Gunakan Node.js LTS yang kompatibel dengan Next.js versi yang dipilih.

### Step 2 — Create Next.js Project

```
npx create-next-app@latest rssfusion \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

Masuk ke project:

```
cd rssfusion
```

### Step 3 — Initialize Git

```
git init
git branch -M main
```

### Step 4 — Install shadcn/ui

```
npx shadcn@latest init
```

Tambahkan komponen dasar:

```
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add sidebar
npx shadcn@latest add badge
npx shadcn@latest add table
npx shadcn@latest add skeleton
```

### Step 5 — Install Initial Dependencies

```
npm install lucide-react zod
```

Jangan menginstal dependency yang belum digunakan.

### Step 6 — Create Initial Structure

```
rssfusion/
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── ui/
│   ├── lib/
│   └── types/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

### Step 7 — Create Environment Template

`.env.example`:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Jangan masukkan secret sebenarnya.

### Step 8 — Verify Application

```
npm run dev
```

Open:

```
http://localhost:3000
```

Verifikasi:

```
npm run lint
npx tsc --noEmit
npm run build
```

## 4. Required Commands

```
npm install
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

## 5. AI CODING ASSISTANT PROMPT

```
Kamu bertindak sebagai Senior Fullstack Developer.

Project:
RSSFusion – Information Intelligence

Dokumen utama:
PROJECT_PRD_AND_PLAYBOOK.md

Development approach:
Solo developer, MVP first, clean architecture pragmatis.

PHASE:
1 — Environment & Project Bootstrap

TASK:

Baca PRD dan instruksi Phase 1 terlebih dahulu.

Periksa kondisi environment dan repository sebelum melakukan perubahan.

Kerjakan:

1. Setup Next.js menggunakan App Router.
2. Setup TypeScript strict mode.
3. Setup Tailwind CSS.
4. Setup shadcn/ui.
5. Setup ESLint.
6. Setup Git.
7. Install dependency dasar yang dibutuhkan.
8. Buat initial folder structure.
9. Buat .env.example.
10. Buat README.md awal.
11. Pastikan aplikasi dapat berjalan.

Gunakan npm sebagai package manager.

BATASAN:

- Jangan implementasikan authentication.
- Jangan implementasikan database.
- Jangan implementasikan RSS fetching.
- Jangan membuat dashboard lengkap.
- Jangan menambahkan fitur di luar Phase 1.
- Jangan mengubah tech stack tanpa alasan kuat.

EXPECTED FILES:

- package.json
- tsconfig.json
- src/app/
- src/components/
- src/lib/
- src/types/
- .env.example
- README.md

VALIDATION:

Jalankan:

npm run lint
npx tsc --noEmit
npm run build

Jangan mengarang hasil testing.

OUTPUT:

Laporkan:

1. Environment setup.
2. Project structure.
3. Dependency yang ditambahkan.
4. File yang dibuat dan diubah.
5. Command yang dijalankan.
6. Hasil testing aktual.
7. Kendala yang ditemukan.

Jangan melanjutkan Phase 2.
```

## 6. Expected Deliverables

- Next.js project.
- TypeScript configuration.
- Tailwind configuration.
- shadcn/ui.
- Git repository.
- `.env.example`.
- README.md.

## 7. Acceptance Criteria

- Next.js berjalan.
- TypeScript tidak error.
- Tailwind berfungsi.
- shadcn/ui dapat digunakan.
- ESLint berjalan.
- Git initialized.
- Environment template tersedia.
- Production build berhasil.

## 8. Testing Requirements

```
npm run lint
npx tsc --noEmit
npm run build
```

Semua command harus dijalankan aktual.

## 9. Git Checkpoint

```
git add .
git commit -m "phase 1: project bootstrap"
```

---

# PHASE 2 — TECHNICAL PLANNING & ARCHITECTURE

## 1. Phase Objective

Membuat technical blueprint sebelum implementasi fitur.

Output utama adalah `TECHNICAL_PLAN.md`.

## 2. Scope of Work

- Review PRD.
- Menentukan folder structure final.
- Menentukan database schema.
- Menentukan API architecture.
- Menentukan worker architecture.
- Menentukan data flow.
- Menentukan dependency.
- Menentukan security strategy.
- Menentukan deployment architecture.
- Mengidentifikasi technical risks.

## 3. Detailed Implementation Steps

### Step 1 — Review Existing Project

Periksa:

- package.json.
- tsconfig.json.
- Existing folders.
- Installed dependencies.
- Next.js configuration.

Jangan melakukan rewrite project.

### Step 2 — Design Application Structure

Target structure:

```
src/
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── dashboard/
│   └── api/
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
├── features/
│   ├── articles/
│   ├── sources/
│   ├── topics/
│   ├── keywords/
│   └── dashboard/
├── hooks/
├── lib/
│   ├── supabase/
│   ├── validation/
│   └── utils/
├── server/
│   ├── services/
│   ├── repositories/
│   └── auth/
└── types/

worker/
├── src/
├── package.json
└── tsconfig.json

supabase/
└── migrations/
```

### Step 3 — Design Database

Tentukan:

- Table definitions.
- Foreign keys.
- Unique constraints.
- Indexes.
- RLS policies.
- Database migrations.

### Step 4 — Define API Contracts

Contoh:

| Method | Endpoint                 | Purpose              |
| ------ | ------------------------ | -------------------- |
| GET    | `/api/articles`          | List articles        |
| GET    | `/api/articles/[id]`     | Article detail       |
| GET    | `/api/dashboard/stats`   | Dashboard statistics |
| GET    | `/api/sources`           | List sources         |
| POST   | `/api/sources`           | Create source        |
| GET    | `/api/sources/[id]`      | Source detail        |
| PATCH  | `/api/sources/[id]`      | Update source        |
| DELETE | `/api/sources/[id]`      | Delete source        |
| POST   | `/api/sources/validate`  | Validate RSS         |
| GET    | `/api/topics`            | List topics          |
| POST   | `/api/topics`            | Create topic         |
| PATCH  | `/api/topics/[id]`       | Update topic         |
| DELETE | `/api/topics/[id]`       | Delete topic         |
| GET    | `/api/keywords`          | List keywords        |
| POST   | `/api/keywords`          | Create keyword       |
| DELETE | `/api/keywords/[id]`     | Delete keyword       |
| GET    | `/api/saved`             | List saved articles  |
| POST   | `/api/saved`             | Save article         |
| DELETE | `/api/saved/[articleId]` | Unsave article       |

### Step 5 — Define Worker Data Flow

```
Worker Start
    |
    v
Poll PostgreSQL
    |
    v
Claim Due Sources
    |
    v
Fetch RSS
    |
    v
Parse
    |
    v
Normalize
    |
    v
Deduplicate
    |
    v
Insert Articles
    |
    v
Match Keywords
    |
    v
Update Source Status
    |
    v
Repeat
```

### Step 6 — Define Deployment

- Next.js: Vercel.
- Database: Supabase.
- Worker: VPS.
- Worker process manager: systemd or PM2.
- Optional reverse proxy: Nginx or Caddy.
- HTTPS: Vercel and VPS reverse proxy.

### Step 7 — Write Technical Plan

Buat:

`TECHNICAL_PLAN.md`

Isi:

1. Architecture overview.
2. Technology decisions.
3. Folder structure.
4. Database schema.
5. API contracts.
6. Worker architecture.
7. Data flow.
8. Authentication.
9. Security.
10. Environment variables.
11. Deployment architecture.
12. Technical risks.
13. Development sequence.

## 4. Required Commands

```
tree -I "node_modules|.next|.git"
npm list --depth=0
```

Jika `tree` tidak tersedia, gunakan:

```
find . -maxdepth 3 -type f
```

## 5. AI CODING ASSISTANT PROMPT

```
Kamu bertindak sebagai Senior Software Architect.

Project:
RSSFusion – Information Intelligence

Documents:
- PROJECT_PRD_AND_PLAYBOOK.md

PHASE:
2 — Technical Planning & Architecture

TASK:

Analisis PRD dan repository yang tersedia.

Buat technical blueprint yang lengkap sebelum implementasi.

Tentukan:

1. Final folder structure.
2. Modular monolith architecture.
3. Next.js Route Handler responsibilities.
4. Supabase PostgreSQL schema.
5. Authentication architecture.
6. RLS policies.
7. API contracts.
8. RSS background worker architecture.
9. PostgreSQL job scheduling strategy.
10. Article normalization and deduplication.
11. Keyword matching.
12. Quota enforcement.
13. SSRF protection.
14. Environment variables.
15. Deployment architecture.
16. Technical dependencies.
17. Testing strategy.

Buat TECHNICAL_PLAN.md.

PENTING:

- Worker harus terpisah dari Next.js.
- Jangan menggunakan microservices.
- Jangan menambahkan Redis/BullMQ pada MVP.
- Jangan membuat implementasi fitur.
- Jangan mengubah package.json kecuali benar-benar diperlukan untuk mendokumentasikan keputusan.
- Jangan membuat database migration pada phase ini.
- Jangan mengarang hasil pengujian.

OUTPUT:

TECHNICAL_PLAN.md yang dapat menjadi technical reference untuk phase berikutnya.

Laporkan seluruh keputusan arsitektur dan trade-off.

Jangan melanjutkan Phase 3.
```

## 6. Expected Deliverables

- `TECHNICAL_PLAN.md`.
- Final folder structure.
- Database blueprint.
- API contracts.
- Worker architecture.
- Deployment blueprint.

## 7. Acceptance Criteria

- Arsitektur terdokumentasi.
- Database schema jelas.
- API contracts jelas.
- Worker architecture jelas.
- Security strategy tersedia.
- Deployment strategy tersedia.
- Tidak ada teknologi tanpa alasan.
- Technical risks teridentifikasi.

## 8. Testing Requirements

Tidak ada business feature yang perlu diuji.

Lakukan:

- Review struktur project.
- Validasi konsistensi dokumentasi.
- Validasi dependency decisions.
- Pastikan technical plan tidak bertentangan dengan PRD.

## 9. Git Checkpoint

```
git add .
git commit -m "phase 2: technical architecture"
```

---

# PHASE 3 — UI/UX PLANNING & DESIGN SYSTEM

## 1. Phase Objective

Menentukan desain visual dan user experience RSSFusion sebelum implementasi frontend.

Output utama: `UI_UX_GUIDE.md`.

## 2. Scope of Work

- Design direction.
- Color system.
- Typography.
- Spacing.
- Layout.
- Sidebar.
- Dashboard.
- Article list.
- Source management.
- Topic management.
- Responsive behavior.
- Component inventory.
- Interaction states.

## 3. Detailed Implementation Steps

### Step 1 — Define Design Direction

Gunakan pendekatan:

Modern SaaS Information Dashboard.

Referensi:

- Feedly.
- Linear.
- Notion.
- Readwise Reader.

Jangan menyalin desain secara langsung.

### Step 2 — Define Design Tokens

Contoh:

```
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;

  --primary: 239 84% 67%;
  --secondary: 215 20% 95%;

  --muted: 215 16% 95%;
  --border: 214 32% 91%;

  --success: 142 71% 45%;
  --warning: 38 92% 50%;
  --destructive: 0 84% 60%;
}
```

### Step 3 — Define Navigation

Sidebar:

- Overview.
- Articles.
- Sources.
- Topics.
- Keywords.
- Saved Articles.
- Settings.

### Step 4 — Define Main Screens

Dashboard:

- Statistics.
- Latest articles.
- Topic overview.
- Source health.

Articles:

- Search.
- Filters.
- Article cards.
- Pagination.

Sources:

- Source list.
- Add source dialog.
- Feed status.
- Last fetched information.

Topics:

- Topic list.
- Keyword associations.
- Topic details.

Saved:

- Saved article list.

### Step 5 — Define Component Inventory

Buat spesifikasi:

- AppSidebar.
- Topbar.
- DashboardLayout.
- ArticleCard.
- ArticleList.
- ArticleFilter.
- SourceCard.
- SourceForm.
- TopicForm.
- KeywordInput.
- StatCard.
- EmptyState.
- LoadingSkeleton.

### Step 6 — Define Responsive Design

Desktop:

- Fixed sidebar.
- Main content area.
- Multi-column statistics.

Mobile:

- Drawer navigation.
- Single column.
- Collapsible filters.
- Responsive dialogs.

### Step 7 — Document UX States

Setiap halaman harus memiliki:

- Loading.
- Empty.
- Error.
- Success.
- Disabled.

### Step 8 — Create UI/UX Guide

Buat `UI_UX_GUIDE.md`.

## 4. Required Commands

```
ls
cat package.json
```

Tidak diperlukan dependency baru untuk fase perencanaan ini.

## 5. AI CODING ASSISTANT PROMPT

```
Kamu bertindak sebagai Senior Product Designer dan Frontend Architect.

Project:
RSSFusion – Information Intelligence

Documents:
- PROJECT_PRD_AND_PLAYBOOK.md
- TECHNICAL_PLAN.md

PHASE:
3 — UI/UX Planning & Design System

TASK:

Analisis PRD dan technical architecture.

Buat UI_UX_GUIDE.md yang menjelaskan:

1. Design direction.
2. Visual identity.
3. Color palette.
4. Typography.
5. Spacing system.
6. Layout.
7. Sidebar navigation.
8. Dashboard design.
9. Article list design.
10. RSS source management.
11. Topic management.
12. Keyword management.
13. Saved articles.
14. Responsive behavior.
15. Component inventory.
16. Loading states.
17. Empty states.
18. Error states.
19. Accessibility.

Desain harus profesional dan cocok untuk Information Intelligence SaaS.

Gunakan Feedly, Linear, dan Readwise Reader sebagai referensi pengalaman pengguna.

BATASAN:

- Jangan implementasikan fitur.
- Jangan mengubah business logic.
- Jangan menambahkan dependency.
- Jangan membuat desain yang terlalu kompleks.
- Jangan mengabaikan mobile experience.

OUTPUT:

UI_UX_GUIDE.md.

Jangan melanjutkan Phase 4.
```

## 6. Expected Deliverables

- `UI_UX_GUIDE.md`.
- Design tokens.
- Navigation specification.
- Component inventory.
- Responsive guidelines.

## 7. Acceptance Criteria

- Design direction jelas.
- Warna terdokumentasi.
- Typography ditentukan.
- Layout ditentukan.
- Navigation jelas.
- Semua halaman utama memiliki spesifikasi.
- Responsive behavior jelas.
- UX states tersedia.

## 8. Testing Requirements

Review dokumentasi dan konsistensi dengan PRD.

## 9. Git Checkpoint

```
git add .
git commit -m "phase 3: ui ux planning"
```

---

# PHASE 4 — FRONTEND FOUNDATION & APPLICATION SHELL

## 1. Phase Objective

Mengimplementasikan fondasi UI dan application shell RSSFusion.

## 2. Scope of Work

- Final folder structure.
- Global layout.
- Dashboard layout.
- Sidebar.
- Topbar.
- Public layout.
- Navigation.
- Theme support.
- Reusable UI components.
- Basic page routing.

Tidak ada business logic RSS.

## 3. Detailed Implementation Steps

### Step 1 — Implement Folder Structure

Ikuti `TECHNICAL_PLAN.md`.

### Step 2 — Implement Global Styles

Gunakan design tokens dari `UI_UX_GUIDE.md`.

### Step 3 — Implement Public Layout

Buat:

- Public navbar.
- Public footer.
- Main content container.

### Step 4 — Implement Dashboard Layout

Buat:

- Dashboard sidebar.
- Topbar.
- User menu placeholder.
- Responsive sidebar drawer.
- Main content container.

### Step 5 — Implement Navigation

Hubungkan:

```
/dashboard
/dashboard/articles
/dashboard/sources
/dashboard/topics
/dashboard/keywords
/dashboard/saved
/dashboard/settings
```

### Step 6 — Implement Reusable Components

Minimal:

- StatCard.
- PageHeader.
- EmptyState.
- ErrorState.
- LoadingSkeleton.
- ConfirmDialog.
- StatusBadge.

### Step 7 — Implement Placeholder Pages

Setiap halaman memiliki heading dan struktur dasar.

### Step 8 — Verify Responsive Layout

Periksa:

- Desktop.
- Tablet.
- Mobile.

## 4. Required Commands

```
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

## 5. AI CODING ASSISTANT PROMPT

```
Kamu bertindak sebagai Senior Frontend Developer.

Project:
RSSFusion – Information Intelligence

Documents:
- PROJECT_PRD_AND_PLAYBOOK.md
- TECHNICAL_PLAN.md
- UI_UX_GUIDE.md

PHASE:
4 — Frontend Foundation & Application Shell

TASK:

Implementasikan frontend foundation RSSFusion.

Kerjakan:

1. Final folder structure.
2. Global styles.
3. Design tokens.
4. Public layout.
5. Dashboard layout.
6. Sidebar navigation.
7. Topbar.
8. Responsive navigation.
9. Reusable UI components.
10. Basic route pages.
11. Placeholder content.
12. Theme support jika dibutuhkan.

Pastikan semua desain mengikuti UI_UX_GUIDE.md.

BATASAN:

- Jangan implementasikan authentication.
- Jangan implementasikan RSS fetching.
- Jangan implementasikan database.
- Jangan membuat business logic.
- Jangan menggunakan mock data sebagai production feature.
- Jangan mengimplementasikan fitur utama.

Gunakan placeholder UI seperlunya.

EXPECTED FILES:

- src/app/
- src/components/layout/
- src/components/shared/
- src/features/
- src/lib/
- src/types/

VALIDATION:

npm run lint
npx tsc --noEmit
npm run build

Lakukan pemeriksaan responsive secara aktual.

Laporkan file yang dibuat dan hasil testing.

Jangan melanjutkan Phase 5.
```

## 6. Expected Deliverables

- Dashboard shell.
- Public shell.
- Sidebar.
- Topbar.
- Basic routing.
- Shared components.
- Responsive UI.

## 7. Acceptance Criteria

- Layout tampil benar.
- Navigation berfungsi.
- Sidebar responsive.
- Semua placeholder routes tersedia.
- Reusable components tersedia.
- Tidak ada business logic.
- TypeScript berhasil.
- Build berhasil.

## 8. Testing Requirements

```
npm run lint
npx tsc --noEmit
npm run build
```

Manual responsive testing.

## 9. Git Checkpoint

```
git add .
git commit -m "phase 4: frontend foundation"
```

---

# PHASE 5 — CORE FRONTEND FEATURE DEVELOPMENT

## 1. Phase Objective

Membangun seluruh core user interface RSSFusion menggunakan mock data yang terkontrol.

Backend belum menjadi sumber data utama pada fase ini.

## 2. Scope of Work

- Dashboard UI.
- Articles UI.
- Sources UI.
- Topics UI.
- Keywords UI.
- Saved articles UI.
- Search.
- Filters.
- Pagination.
- Form validation.
- Client state.

## 3. Detailed Implementation Steps

### Step 1 — Dashboard UI

Implementasikan:

- Total sources.
- Total articles.
- Total topics.
- Saved articles.
- Latest articles.
- Recent activity.

Gunakan mock data sementara.

### Step 2 — Article Management UI

Implementasikan:

- ArticleCard.
- ArticleList.
- ArticleSearch.
- Source filter.
- Topic filter.
- Date filter.
- Pagination.
- Save button.

### Step 3 — Sources UI

Implementasikan:

- Source table/list.
- Add source dialog.
- Edit source.
- Delete confirmation.
- Enabled/disabled toggle.
- Source status.

### Step 4 — Topics UI

Implementasikan:

- Topic list.
- Create topic.
- Edit topic.
- Delete topic.
- Topic detail.

### Step 5 — Keywords UI

Implementasikan:

- Keyword list.
- Add keyword.
- Edit keyword.
- Delete keyword.
- Topic association.

### Step 6 — Saved Articles UI

Implementasikan:

- Saved article list.
- Unsave interaction.
- Empty state.

### Step 7 — Form Validation

Gunakan Zod.

Validasi:

- RSS URL.
- Source name.
- Topic name.
- Keyword.
- Search input.

### Step 8 — State Management

Gunakan React state untuk state lokal.

Zustand hanya jika diperlukan untuk shared client-side state.

Jangan menyimpan server data secara permanen dalam Zustand.

### Step 9 — Mock Data Boundary

Buat:

```
src/features/
├── articles/
│   └── mocks/
├── sources/
│   └── mocks/
├── topics/
│   └── mocks/
└── keywords/
    └── mocks/
```

Semua mock data harus mudah dihapus pada Phase 7.

### Step 10 — UX Completion

Pastikan:

- Loading.
- Empty.
- Error.
- Success.
- Form disabled state.

## 4. Required Commands

```
npm install react-hook-form @hookform/resolvers
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

Gunakan dependency tersebut apabila form kompleks membutuhkan React Hook Form.

## 5. AI CODING ASSISTANT PROMPT

```
Kamu bertindak sebagai Senior Frontend Developer.

Project:
RSSFusion – Information Intelligence

Documents:
- PROJECT_PRD_AND_PLAYBOOK.md
- TECHNICAL_PLAN.md
- UI_UX_GUIDE.md

PHASE:
5 — Core Frontend Feature Development

TASK:

Implementasikan core frontend features RSSFusion.

FITUR:

1. Dashboard.
2. Article listing.
3. Article search.
4. Article filters.
5. Pagination.
6. RSS source management UI.
7. Add source form.
8. Edit source UI.
9. Delete source UI.
10. Topic management.
11. Keyword management.
12. Saved articles.
13. Form validation.
14. Loading states.
15. Empty states.
16. Error states.
17. Success notifications.

Gunakan mock data yang terisolasi dalam folder mocks.

Pastikan seluruh komponen dapat diintegrasikan dengan API pada phase berikutnya.

BATASAN:

- Jangan implementasikan database.
- Jangan implementasikan RSS worker.
- Jangan membuat API production.
- Jangan mengimplementasikan authentication.
- Jangan menganggap mock data sebagai data production.
- Jangan menambahkan fitur P2.

OUTPUT:

Frontend core features yang siap diintegrasikan dengan backend.

VALIDATION:

npm run lint
npx tsc --noEmit
npm run build

Laporkan seluruh mock service yang dibuat.

Jangan melanjutkan Phase 6.
```

## 6. Expected Deliverables

- Functional dashboard UI.
- Article interface.
- Sources management interface.
- Topics management interface.
- Keywords interface.
- Saved articles interface.
- Form validation.
- Isolated mock services.

## 7. Acceptance Criteria

- Semua core halaman selesai.
- Search UI berfungsi.
- Filter UI berfungsi.
- Pagination UI berfungsi.
- CRUD forms berfungsi dengan mock.
- Validation berjalan.
- Loading dan empty states tersedia.
- Mock data terisolasi.
- Responsive UI berhasil.

## 8. Testing Requirements

```
npm run lint
npx tsc --noEmit
npm run build
```

Lakukan manual UI testing pada seluruh halaman.

## 9. Git Checkpoint

```
git add .
git commit -m "phase 5: core frontend features"
```

---

# PHASE 6 — BACKEND & CORE BUSINESS LOGIC

## 1. Phase Objective

Mengimplementasikan backend, database, authentication, RSS processing, dan core business logic.

Ini merupakan phase paling penting secara teknis.

## 2. Scope of Work

- Supabase setup.
- Database migrations.
- Authentication.
- RLS.
- API routes.
- RSS validation.
- RSS worker.
- Feed parsing.
- Article normalization.
- Deduplication.
- Keyword matching.
- Quota enforcement.
- Error handling.
- Logging.
- SSRF protection.

## 3. Detailed Implementation Steps

### Step 1 — Setup Supabase

Install:

```
npm install @supabase/supabase-js @supabase/ssr
```

Jika menggunakan Supabase CLI:

```
npx supabase init
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

Konfigurasi local development sesuai kebutuhan.

### Step 2 — Implement Supabase Clients

Buat:

```
src/lib/supabase/
├── client.ts
├── server.ts
└── middleware.ts
```

Gunakan browser client dan server client secara terpisah.

### Step 3 — Database Migrations

Buat migration:

```
npx supabase migration new create_initial_schema
```

Implementasikan:

- profiles.
- rss_sources.
- articles.
- topics.
- keywords.
- article_keyword_matches.
- saved_articles.
- article_read_status.
- feed_fetch_logs.

Tambahkan indexes, foreign keys, unique constraints, dan RLS.

### Step 4 — Authentication

Implementasikan:

- Register.
- Login.
- Logout.
- Session handling.
- Protected routes.

### Step 5 — API Implementation

Implementasikan API sesuai kontrak Phase 2.

Setiap endpoint harus:

1. Memvalidasi session.
2. Memvalidasi ownership.
3. Memvalidasi input.
4. Menjalankan use case.
5. Mengembalikan response konsisten.

### Step 6 — RSS Validation Service

Install:

```
npm install rss-parser
```

Implementasikan:

- URL validation.
- DNS/IP validation.
- SSRF prevention.
- HTTP timeout.
- Redirect validation.
- Feed parsing.
- Feed preview.

Jangan mempercayai URL dari pengguna.

### Step 7 — Setup Worker

Buat package terpisah:

```
mkdir -p worker/src
cd worker
npm init -y
npm install rss-parser zod
npm install -D typescript tsx @types/node
npx tsc --init
cd ..
```

Worker menggunakan TypeScript.

Gunakan dependency versi yang kompatibel dan validasi hasil instalasi.

### Step 8 — Implement Worker Scheduler

Implementasikan:

- Polling.
- Due source selection.
- PostgreSQL job claiming.
- Lock expiration.
- Concurrency limit.
- Retry.
- Backoff.

Gunakan PostgreSQL sebagai scheduler store.

### Step 9 — Implement Feed Fetching

Implementasikan:

- HTTP request.
- Timeout.
- User-Agent.
- ETag.
- Last-Modified.
- HTTP 304.
- HTTP status handling.
- Response size limit.

### Step 10 — Implement Article Processing

Pipeline:

```
RAW FEED ITEM
     |
     v
VALIDATE
     |
     v
NORMALIZE
     |
     v
CANONICALIZE URL
     |
     v
CHECK DUPLICATE
     |
     v
INSERT ARTICLE
     |
     v
MATCH KEYWORDS
     |
     v
INSERT MATCHES
```

### Step 11 — Implement Quota Enforcement

Backend memeriksa:

- Maximum sources.
- Maximum keywords.
- Maximum topics.

Quota diperiksa sebelum create operation.

### Step 12 — Implement Feed Logs

Simpan:

- Status.
- HTTP status.
- Duration.
- Articles found.
- Articles inserted.
- Error.

### Step 13 — Logging

Gunakan structured logging.

Minimal:

- Worker started.
- Worker stopped.
- Source claimed.
- Fetch success.
- Fetch failed.
- Articles inserted.
- Keyword matches created.

Jangan log password, token, atau credential.

## 4. Required Commands

```
npm install @supabase/supabase-js @supabase/ssr rss-parser zod

npx supabase init

npx supabase migration new create_initial_schema

npm run lint
npx tsc --noEmit
npm run build
```

Worker:

```
cd worker
npm install
npx tsc --noEmit
cd ..
```

## 5. AI CODING ASSISTANT PROMPT

```
Kamu bertindak sebagai Senior Backend Engineer dan Software Architect.

Project:
RSSFusion – Information Intelligence

Documents:
- PROJECT_PRD_AND_PLAYBOOK.md
- TECHNICAL_PLAN.md
- UI_UX_GUIDE.md

PHASE:
6 — Backend & Core Business Logic

TASK:

Implementasikan backend RSSFusion berdasarkan technical plan.

PRIORITAS:

A. DATABASE

1. Supabase integration.
2. PostgreSQL migrations.
3. Profiles.
4. RSS sources.
5. Articles.
6. Topics.
7. Keywords.
8. Article keyword matches.
9. Saved articles.
10. Article read status.
11. Feed fetch logs.
12. Indexes.
13. Constraints.
14. RLS.

B. AUTHENTICATION

1. Register.
2. Login.
3. Logout.
4. Session handling.
5. Protected access.

C. API

Implementasikan seluruh core API berdasarkan TECHNICAL_PLAN.md.

D. RSS ENGINE

1. Feed URL validation.
2. SSRF protection.
3. RSS/Atom parsing.
4. Article normalization.
5. URL canonicalization.
6. Deduplication.
7. Feed error handling.

E. WORKER

1. Separate Node.js TypeScript worker.
2. PostgreSQL scheduler.
3. Job claiming.
4. Lock expiration.
5. Concurrency control.
6. RSS fetching.
7. Retry and backoff.
8. Article insertion.
9. Keyword matching.
10. Feed logging.

F. QUOTA

Implementasikan Free plan limits pada backend.

SECURITY:

- RLS.
- Authentication.
- Ownership validation.
- Input validation.
- SSRF protection.
- Rate limiting strategy.
- Safe error responses.

BATASAN:

- Jangan menggunakan microservices.
- Jangan menambahkan Redis/BullMQ.
- Jangan menjalankan worker melalui Next.js request lifecycle.
- Jangan menyimpan service role key di frontend.
- Jangan membuat fitur P2.
- Jangan menggunakan mock data.
- Jangan mengabaikan unique constraints.
- Jangan mengasumsikan database migration berhasil tanpa menjalankannya.

VALIDATION:

Jalankan migration pada environment yang tersedia.

Jalankan:

npm run lint
npx tsc --noEmit
npm run build

Worker:

cd worker
npx tsc --noEmit

Lakukan unit/integration testing terhadap RSS parser, normalization, deduplication, dan keyword matching.

OUTPUT:

Laporkan:
- Database schema.
- API endpoints.
- Worker implementation.
- Security controls.
- Dependencies.
- Migration status.
- Testing results.
- Known limitations.

Jangan melanjutkan Phase 7.
```

## 6. Expected Deliverables

- Supabase integration.
- Database migrations.
- Authentication.
- RLS.
- API endpoints.
- RSS parser service.
- RSS worker.
- Scheduler.
- Deduplication.
- Keyword matching.
- Quota enforcement.
- Logging.

## 7. Acceptance Criteria

- Supabase connected.
- Database migrations valid.
- Authentication berfungsi.
- RLS aktif.
- API berfungsi.
- RSS validation berfungsi.
- Worker berjalan terpisah.
- Worker dapat melakukan fetching.
- Artikel tersimpan.
- Duplicate prevention berjalan.
- Keyword matching berjalan.
- Quota enforcement berjalan.
- SSRF protection tersedia.
- Logging tersedia.

## 8. Testing Requirements

Unit testing:

- Feed URL validation.
- Feed parsing.
- Article normalization.
- Deduplication.
- Keyword matching.
- Quota validation.
- Retry behavior.

Integration testing:

- Supabase database.
- Authentication.
- RLS.
- Source CRUD.
- Article insertion.
- Worker processing.

Gunakan test RSS fixtures, bukan selalu mengandalkan internet.

## 9. Git Checkpoint

```
git add .
git commit -m "phase 6: backend implementation"
```

---

# PHASE 7 — FRONTEND & BACKEND INTEGRATION

## 1. Phase Objective

Mengintegrasikan seluruh frontend dengan backend production-ready.

## 2. Scope of Work

- Replace mock data.
- API service integration.
- Authentication integration.
- Data fetching.
- Form submission.
- Search.
- Filtering.
- Pagination.
- Error mapping.
- Loading states.
- Retry behavior.

## 3. Detailed Implementation Steps

### Step 1 — Remove Mock Data Dependencies

Identifikasi seluruh mock service.

Jangan menghapus mock fixtures yang masih digunakan oleh automated tests.

Ganti production UI dependencies dengan API services.

### Step 2 — Implement API Client

Gunakan native fetch.

Contoh:

```
export async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, options);

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error?.message ?? "Request failed"
    );
  }

  return result.data;
}
```

Implementasi aktual harus menangani response invalid, network failure, dan HTTP error secara konsisten.

### Step 3 — Integrate Authentication

- Register form.
- Login form.
- Session handling.
- Protected routes.
- Logout.

### Step 4 — Integrate Sources

- Fetch sources.
- Create source.
- Validate feed.
- Update source.
- Delete source.
- Toggle enabled.

### Step 5 — Integrate Articles

- Fetch articles.
- Search.
- Filter.
- Pagination.
- Article details.
- Saved articles.

### Step 6 — Integrate Topics and Keywords

- Create topic.
- Update topic.
- Delete topic.
- Create keyword.
- Delete keyword.
- Display matches.

### Step 7 — Integrate Dashboard

Ambil statistik dari database.

### Step 8 — Handle API States

Setiap halaman harus mendukung:

- Loading.
- Error.
- Empty.
- Success.

### Step 9 — Verify End-to-End Flow

```
Register
  |
  v
Login
  |
  v
Create Source
  |
  v
Validate RSS
  |
  v
Save Source
  |
  v
Worker Fetch
  |
  v
Article Stored
  |
  v
Article Appears
  |
  v
Create Keyword
  |
  v
Article Matching
  |
  v
Search / Save
```

## 4. Required Commands

```
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

## 5. AI CODING ASSISTANT PROMPT

```
Kamu bertindak sebagai Senior Fullstack Developer.

Project:
RSSFusion – Information Intelligence

Documents:
- PROJECT_PRD_AND_PLAYBOOK.md
- TECHNICAL_PLAN.md
- UI_UX_GUIDE.md

PHASE:
7 — Frontend & Backend Integration

TASK:

Hubungkan seluruh core frontend dengan backend RSSFusion.

KERJAKAN:

1. Integrate authentication.
2. Replace mock services.
3. Integrate article API.
4. Integrate source API.
5. Integrate topic API.
6. Integrate keyword API.
7. Integrate saved article API.
8. Integrate dashboard statistics.
9. Implement search.
10. Implement filters.
11. Implement pagination.
12. Implement form submission.
13. Implement error mapping.
14. Implement loading states.
15. Implement retry behavior where appropriate.

PENTING:

- Jangan menggunakan mock data sebagai production source.
- Jangan mengubah backend contract tanpa alasan.
- Jangan memindahkan business logic ke client.
- Jangan menyimpan sensitive information di Zustand.
- Gunakan native fetch kecuali ada kebutuhan nyata untuk HTTP library.
- Pertahankan responsive design.

END-TO-END FLOW:

Register -> Login -> Add RSS Source -> Fetch Articles -> Create Keyword -> View Matching Articles -> Save Article.

VALIDATION:

npm run lint
npx tsc --noEmit
npm run build

Lakukan end-to-end verification menggunakan database dan worker yang tersedia.

Laporkan setiap mock service yang sudah dihapus atau masih digunakan untuk testing.

Jangan melanjutkan Phase 8.
```

## 6. Expected Deliverables

- Fully integrated frontend.
- Real API services.
- Authentication integration.
- Real database data.
- Working CRUD.
- Working search and filtering.
- Working article flow.

## 7. Acceptance Criteria

- Login dan register berfungsi.
- Sources menggunakan database.
- Articles menggunakan database.
- Topics menggunakan database.
- Keywords menggunakan database.
- Saved articles berfungsi.
- Search berfungsi.
- Filter berfungsi.
- Pagination berfungsi.
- Dashboard menampilkan data aktual.
- Tidak ada production mock data.
- Error states berjalan.

## 8. Testing Requirements

E2E test:

- Register.
- Login.
- Add source.
- Create topic.
- Create keyword.
- Display articles.
- Save article.
- Unsave article.
- Logout.

## 9. Git Checkpoint

```
git add .
git commit -m "phase 7: frontend backend integration"
```

---

# PHASE 8 — ADDITIONAL FEATURES & PRODUCT COMPLETION

## 1. Phase Objective

Menyelesaikan fitur P1 yang meningkatkan kegunaan produk.

## 2. Scope of Work

Prioritas implementasi:

1. Feed health monitoring UI.
2. Manual source refresh.
3. OPML import.
4. OPML export.
5. Read status.
6. Email notifications.
7. Basic trend analytics.
8. SEO.
9. Accessibility improvements.

Fitur P2 tidak boleh diimplementasikan.

## 3. Detailed Implementation Steps

### Step 1 — Feed Health Monitoring

Tampilkan:

- Last fetched.
- Last successful fetch.
- Consecutive failures.
- Last error.
- Source status.

### Step 2 — Manual Refresh

Pengguna dapat meminta source di-fetch kembali.

Jangan menjalankan HTTP fetch langsung pada API request.

API hanya membuat refresh job atau menjadwalkan next_fetch_at.

Worker memproses pekerjaan tersebut.

Terapkan rate limiting.

### Step 3 — OPML Import

Implementasikan:

- Upload OPML.
- Parse XML.
- Preview feeds.
- Validate.
- Import valid feeds.
- Skip duplicates.

### Step 4 — OPML Export

Export daftar source pengguna dalam format OPML yang valid.

### Step 5 — Read Status

Implementasikan:

- Mark as read.
- Mark as unread.
- Read status indicator.

### Step 6 — Email Notifications

Gunakan provider seperti Resend.

Alur:

```
NEW ARTICLE
    |
    v
KEYWORD MATCH
    |
    v
CHECK USER PREFERENCE
    |
    v
CREATE NOTIFICATION JOB
    |
    v
WORKER SENDS EMAIL
    |
    v
SAVE DELIVERY STATUS
```

Tambahkan idempotency untuk menghindari email duplikat.

### Step 7 — Trend Analytics

Tampilkan:

- Articles per day.
- Articles per week.
- Publications per topic.
- Top sources.

Gunakan Recharts jika dibutuhkan:

```
npm install recharts
```

### Step 8 — SEO

Implementasikan:

- Metadata.
- Open Graph.
- Public landing page SEO.
- Sitemap.
- Robots.txt.

Dashboard private tidak perlu diindeks.

### Step 9 — Accessibility

Periksa:

- Keyboard navigation.
- Focus states.
- Form labels.
- Color contrast.
- Semantic structure.

## 4. Required Commands

```
npm install recharts
npm run lint
npx tsc --noEmit
npm run build
```

Install Recharts hanya jika analytics chart benar-benar diimplementasikan.

## 5. AI CODING ASSISTANT PROMPT

```
Kamu bertindak sebagai Senior Fullstack Product Developer.

Project:
RSSFusion – Information Intelligence

Documents:
- PROJECT_PRD_AND_PLAYBOOK.md
- TECHNICAL_PLAN.md
- UI_UX_GUIDE.md

PHASE:
8 — Additional Features & Product Completion

TASK:

Implementasikan fitur P1 RSSFusion.

PRIORITY:

1. Feed health monitoring.
2. Manual refresh.
3. OPML import.
4. OPML export.
5. Read/unread status.
6. Email notification.
7. Basic trend analytics.
8. SEO.
9. Accessibility improvements.

Pastikan fitur mengikuti arsitektur yang sudah ada.

BATASAN:

- Jangan implementasikan fitur P2.
- Jangan menambahkan AI API sebagai dependency wajib.
- Jangan membuat microservices.
- Jangan mengubah arsitektur worker tanpa kebutuhan.
- Jangan mengirim email langsung dari request browser.
- Jangan mengabaikan notification deduplication.
- Jangan mengimplementasikan pembayaran jika tidak diperlukan untuk MVP.

VALIDATION:

npm run lint
npx tsc --noEmit
npm run build

Uji setiap fitur yang diimplementasikan.

OUTPUT:

Laporkan fitur P1 yang selesai, dependency tambahan, testing, dan keterbatasan.

Jangan melanjutkan Phase 9.
```

## 6. Expected Deliverables

- Feed health UI.
- Manual refresh.
- OPML import/export.
- Read status.
- Email notifications.
- Trend analytics.
- SEO.
- Accessibility improvements.

## 7. Acceptance Criteria

- Feed health tersedia.
- Manual refresh berjalan melalui worker.
- OPML import berjalan.
- OPML export berjalan.
- Read/unread berfungsi.
- Email notification berfungsi jika provider dikonfigurasi.
- Analytics menampilkan data aktual.
- SEO tersedia.
- Accessibility diperbaiki.

Fitur yang membutuhkan konfigurasi external service harus dilaporkan sebagai configured atau pending, bukan diklaim berhasil tanpa pengujian.

## 8. Testing Requirements

- Feed refresh integration.
- OPML parser testing.
- OPML export testing.
- Read status testing.
- Email delivery testing.
- Analytics query testing.
- Accessibility review.

## 9. Git Checkpoint

```
git add .
git commit -m "phase 8: additional features"
```

---

# PHASE 9 — TESTING, SECURITY & OPTIMIZATION

## 1. Phase Objective

Melakukan verifikasi menyeluruh sebelum production release.

Tidak ada fitur baru pada phase ini.

Output utama: `TEST_REPORT.md`.

## 2. Scope of Work

- Unit testing.
- Integration testing.
- E2E testing.
- Type checking.
- Linting.
- Production build.
- Responsive testing.
- Security audit.
- Performance optimization.
- Bug fixing.

## 3. Detailed Implementation Steps

### Step 1 — Review Test Coverage

Pastikan tersedia testing untuk:

- Authentication.
- RSS validation.
- RSS parser.
- Article normalization.
- Deduplication.
- Keyword matching.
- Quota.
- Source CRUD.
- Article CRUD/query.
- Saved articles.
- RLS.

### Step 2 — Run Unit Tests

Gunakan Vitest jika belum tersedia:

```
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Jalankan:

```
npx vitest run
```

### Step 3 — Integration Testing

Periksa:

- Database connectivity.
- RLS.
- API authorization.
- Worker database operations.
- Article processing.

### Step 4 — E2E Testing

Jika belum tersedia:

```
npm install -D @playwright/test
npx playwright install
```

Jalankan:

```
npx playwright test
```

### Step 5 — Static Validation

```
npm run lint
npx tsc --noEmit
npm run build
```

### Step 6 — Security Audit

Periksa:

- SSRF.
- XSS.
- SQL injection.
- Authentication bypass.
- Authorization bypass.
- RLS.
- Secret exposure.
- Rate limiting.
- Unsafe redirect.
- URL validation.
- Dependency vulnerabilities.

Jalankan:

```
npm audit
```

### Step 7 — Performance Audit

Periksa:

- Database indexes.
- Pagination.
- N+1 queries.
- RSS worker concurrency.
- Memory usage.
- Large feed response.
- Slow API endpoints.
- Unnecessary client JavaScript.

### Step 8 — Responsive Testing

Uji:

- Desktop.
- Tablet.
- Mobile.

### Step 9 — Create TEST_REPORT.md

Dokumentasikan:

1. Test environment.
2. Test cases.
3. Test results.
4. Failed tests.
5. Security findings.
6. Performance findings.
7. Fixed bugs.
8. Known limitations.
9. Release readiness.

## 4. Required Commands

```
npm run lint
npx tsc --noEmit
npm run build

npx vitest run

npx playwright test

npm audit
```

Jalankan hanya command untuk tool yang telah dikonfigurasi.

## 5. AI CODING ASSISTANT PROMPT

```
Kamu bertindak sebagai Senior QA Engineer dan Application Security Engineer.

Project:
RSSFusion – Information Intelligence

Documents:
- PROJECT_PRD_AND_PLAYBOOK.md
- TECHNICAL_PLAN.md
- UI_UX_GUIDE.md

PHASE:
9 — Testing, Security & Optimization

TASK:

Lakukan comprehensive quality verification RSSFusion.

TESTING:

1. Unit testing.
2. Integration testing.
3. E2E testing.
4. Authentication testing.
5. Authorization testing.
6. RLS testing.
7. RSS parser testing.
8. RSS worker testing.
9. Deduplication testing.
10. Keyword matching testing.
11. Quota testing.
12. UI testing.
13. Responsive testing.

SECURITY:

1. SSRF.
2. XSS.
3. SQL injection.
4. Authentication bypass.
5. Authorization bypass.
6. RLS.
7. Secret exposure.
8. Rate limiting.
9. Unsafe redirects.
10. Dependency vulnerabilities.

PERFORMANCE:

1. API performance.
2. Database indexes.
3. Pagination.
4. Worker concurrency.
5. Memory consumption.
6. Feed response limits.

ATURAN:

- Jangan menambahkan fitur baru.
- Jangan mengubah arsitektur tanpa alasan kuat.
- Jangan menghapus security controls.
- Jangan mengklaim test passed tanpa menjalankannya.
- Perbaiki bug yang ditemukan.
- Catat known limitations.

Buat TEST_REPORT.md.

VALIDATION:

npm run lint
npx tsc --noEmit
npm run build

Jalankan seluruh test suite yang tersedia.

OUTPUT:

1. Test report.
2. Security findings.
3. Performance findings.
4. Fixed bugs.
5. Failed tests.
6. Remaining issues.
7. Release readiness assessment.

Jangan melanjutkan Phase 10 jika masih ada critical security issue.
```

## 6. Expected Deliverables

- Test suite.
- Security review.
- Performance review.
- Bug fixes.
- `TEST_REPORT.md`.

## 7. Acceptance Criteria

- Lint passed.
- Type checking passed.
- Production build passed.
- Core unit tests passed.
- Core integration tests passed.
- Critical E2E flows passed.
- RLS verified.
- SSRF protections verified.
- No unresolved critical security issues.
- Responsive behavior verified.
- TEST_REPORT.md tersedia.

## 8. Testing Requirements

Semua testing harus memiliki hasil aktual.

Jika test membutuhkan external credentials atau service yang tidak tersedia, tandai sebagai blocked dan jelaskan alasannya.

## 9. Git Checkpoint

```
git add .
git commit -m "phase 9: testing and optimization"
```

---

# PHASE 10 — PRODUCTION DEPLOYMENT & RELEASE

## 1. Phase Objective

Melakukan deployment RSSFusion ke production.

## 2. Scope of Work

- Production environment.
- Supabase production.
- Vercel deployment.
- VPS worker deployment.
- Environment variables.
- Domain.
- DNS.
- HTTPS.
- Process manager.
- Monitoring.
- Database backup.
- Smoke testing.
- Release notes.

## 3. Detailed Implementation Steps

### Step 1 — Production Environment

Siapkan:

- Supabase production project.
- Vercel project.
- VPS Ubuntu.
- Domain.
- Email provider jika digunakan.

Jangan menggunakan database development untuk production.

### Step 2 — Database Deployment

Deploy migrations:

```
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Pastikan migration telah direview.

Verifikasi:

- Tables.
- Indexes.
- Constraints.
- RLS.
- Policies.

### Step 3 — Deploy Next.js to Vercel

Install Vercel CLI:

```
npm install -g vercel
```

Login:

```
vercel login
```

Deploy preview:

```
vercel
```

Deploy production:

```
vercel --prod
```

Konfigurasikan production environment variables melalui Vercel Dashboard.

### Step 4 — Setup VPS Worker

SSH:

```
ssh USER@YOUR_VPS_IP
```

Install Node.js LTS.

Install Git:

```
sudo apt update
sudo apt install -y git
```

Clone project:

```
git clone YOUR_REPOSITORY_URL
cd rssfusion/worker
```

Install dependencies:

```
npm install
```

Build worker:

```
npm run build
```

Pastikan package worker memiliki script build yang benar.

### Step 5 — Configure Worker Environment

Buat environment file pada server.

Contoh:

```
WORKER_DATABASE_URL=
WORKER_POLL_INTERVAL_MS=30000
WORKER_CONCURRENCY=5
WORKER_FETCH_TIMEOUT_MS=15000
WORKER_USER_AGENT=RSSFusionBot/1.0
```

Batasi permission file:

```
chmod 600 .env
```

Jangan memasukkan environment file ke Git.

### Step 6 — Run Worker

Gunakan systemd atau PM2.

Contoh systemd service:

```
[Unit]
Description=RSSFusion RSS Worker
After=network.target

[Service]
Type=simple
User=rssfusion
WorkingDirectory=/opt/rssfusion/worker
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
EnvironmentFile=/opt/rssfusion/worker/.env

[Install]
WantedBy=multi-user.target
```

Aktifkan:

```
sudo systemctl daemon-reload
sudo systemctl enable rssfusion-worker
sudo systemctl start rssfusion-worker
```

Periksa:

```
sudo systemctl status rssfusion-worker
sudo journalctl -u rssfusion-worker -f
```

Pastikan Node.js binary path dan working directory sesuai server.

### Step 7 — Configure Domain and DNS

Contoh:

```
rssfusion.com       -> Vercel
www.rssfusion.com   -> Vercel
```

Worker tidak harus memiliki public domain.

Jika membutuhkan worker health endpoint di masa depan, tempatkan di belakang reverse proxy dan proteksi authentication.

### Step 8 — HTTPS

- Aktifkan HTTPS di Vercel.
- Gunakan HTTPS untuk seluruh aplikasi.
- Gunakan secure cookies.
- Pastikan Supabase callback URL sesuai domain production.

### Step 9 — Monitoring

Monitor:

- Next.js errors.
- API response.
- Worker status.
- Worker memory.
- Database connections.
- RSS fetch failures.
- Feed processing duration.
- Email delivery failures.

Gunakan logging yang sudah tersedia sebelum menambahkan monitoring provider baru.

### Step 10 — Database Backup

Aktifkan backup sesuai kemampuan paket Supabase.

Jika dibutuhkan, siapkan backup tambahan dan prosedur restore.

Backup harus diuji secara berkala.

### Step 11 — Production Smoke Test

Verifikasi:

1. Landing page.
2. Register.
3. Login.
4. Dashboard.
5. Add RSS source.
6. Feed validation.
7. Worker fetching.
8. Article storage.
9. Article listing.
10. Keyword matching.
11. Search.
12. Saved articles.
13. Logout.

### Step 12 — Documentation

Buat:

`DEPLOYMENT_GUIDE.md`

Isi:

- Production architecture.
- Environment variables.
- Supabase setup.
- Vercel deployment.
- VPS setup.
- Worker management.
- DNS.
- HTTPS.
- Monitoring.
- Backup.
- Rollback.
- Troubleshooting.

Buat:

`RELEASE_NOTES.md`

Isi:

- Version.
- Release date.
- Features.
- Improvements.
- Known limitations.
- Deployment information.

## 4. Required Commands

```
# Database
npx supabase db push

# Build
npm run build

# Deploy Vercel
vercel
vercel --prod

# Worker
cd worker
npm install
npm run build

# VPS
sudo systemctl daemon-reload
sudo systemctl enable rssfusion-worker
sudo systemctl start rssfusion-worker

# Worker monitoring
sudo systemctl status rssfusion-worker
sudo journalctl -u rssfusion-worker -f
```

## 5. AI CODING ASSISTANT PROMPT

```
Kamu bertindak sebagai Senior DevOps Engineer dan Release Engineer.

Project:
RSSFusion – Information Intelligence

Documents:
- PROJECT_PRD_AND_PLAYBOOK.md
- TECHNICAL_PLAN.md
- UI_UX_GUIDE.md
- TEST_REPORT.md

PHASE:
10 — Production Deployment & Release

TASK:

Siapkan dan dokumentasikan production deployment RSSFusion.

ARCHITECTURE:

- Next.js on Vercel.
- Supabase PostgreSQL.
- Supabase Auth.
- Dedicated RSS Worker on VPS.
- systemd or PM2.
- HTTPS.
- Custom domain.

KERJAKAN:

1. Review production configuration.
2. Review environment variables.
3. Prepare database migration deployment.
4. Prepare Vercel deployment.
5. Prepare worker production build.
6. Prepare VPS deployment instructions.
7. Prepare systemd service.
8. Prepare DNS instructions.
9. Prepare HTTPS.
10. Prepare monitoring.
11. Prepare backup strategy.
12. Prepare rollback procedure.
13. Prepare smoke testing.
14. Create DEPLOYMENT_GUIDE.md.
15. Create RELEASE_NOTES.md.

BATASAN:

- Jangan menggunakan desktop deployment.
- Jangan menggunakan Tauri.
- Jangan menjalankan worker melalui serverless function.
- Jangan memasukkan secret ke Git.
- Jangan melakukan destructive database changes.
- Jangan mengklaim deployment berhasil jika belum dilakukan.
- Jangan menghapus migration history.

PENTING:

Jika tidak memiliki akses ke Vercel, Supabase, atau VPS, buat instruksi deployment yang dapat dieksekusi dan tandai langkah yang belum dilakukan.

OUTPUT:

DEPLOYMENT_GUIDE.md
RELEASE_NOTES.md

Laporkan:

1. Deployment architecture.
2. Production configuration.
3. Environment variables.
4. Worker deployment.
5. Database migration status.
6. Smoke test results.
7. Monitoring.
8. Backup.
9. Known limitations.
10. Release readiness.

Ini merupakan phase terakhir. Jangan membuat phase tambahan.
```

## 6. Expected Deliverables

- Production Next.js application.
- Production database.
- Production RSS worker.
- Environment configuration.
- Domain configuration.
- HTTPS.
- Monitoring.
- Backup strategy.
- `DEPLOYMENT_GUIDE.md`.
- `RELEASE_NOTES.md`.

## 7. Acceptance Criteria

- Production build berhasil.
- Vercel deployment tersedia.
- Supabase production terhubung.
- Migrations terpasang.
- RLS aktif.
- Worker berjalan di VPS.
- Worker auto-restart aktif.
- Domain berfungsi.
- HTTPS aktif.
- Environment secrets aman.
- Backup dikonfigurasi.
- Smoke test berhasil.
- Deployment guide tersedia.
- Release notes tersedia.

## 8. Testing Requirements

Production smoke test.

Periksa:

- Authentication.
- API.
- Database.
- RSS worker.
- Article ingestion.
- Keyword matching.
- Saved articles.
- Logging.
- Worker restart.
- Backup configuration.

## 9. Git Checkpoint

```
git add .
git commit -m "phase 10: production deployment"
```

---

# PART C — GLOBAL AI CODING RULES

Aturan ini berlaku pada seluruh phase.

## C.1 General Rules

1. Baca `PROJECT_PRD_AND_PLAYBOOK.md` terlebih dahulu.
2. Baca `TECHNICAL_PLAN.md` setelah tersedia.
3. Baca `UI_UX_GUIDE.md` setelah tersedia.
4. Kerjakan hanya phase yang diminta.
5. Periksa kondisi repository sebelum mengubah file.
6. Jangan menimpa pekerjaan tanpa alasan.
7. Jangan mengubah tech stack tanpa persetujuan.
8. Jangan menambahkan dependency tanpa alasan.
9. Jangan membuat fitur di luar scope.
10. Jangan menggunakan mock sebagai production implementation.
11. Jangan mengarang hasil testing.
12. Jangan mengklaim deployment berhasil tanpa verifikasi.
13. Jangan melanjutkan phase otomatis.
14. Laporkan seluruh file yang dibuat dan diubah.
15. Laporkan dependency tambahan.
16. Laporkan hasil testing aktual.
17. Jika terdapat keputusan penting yang ambigu, tanyakan terlebih dahulu.

## C.2 RSSFusion-Specific Rules

1. RSS parsing harus dilakukan di worker atau server-side service.
2. Browser tidak melakukan RSS fetching langsung.
3. Artikel harus memiliki source reference.
4. Deduplication dijamin oleh database.
5. Worker harus dapat restart.
6. Fetching harus memiliki timeout.
7. RSS URL harus divalidasi untuk mencegah SSRF.
8. Jangan menganggap semua website menyediakan RSS.
9. Jangan menggunakan scraping arbitrer untuk MVP.
10. Keyword matching harus deterministik.
11. Quota harus diperiksa pada backend.
12. RLS wajib aktif untuk data user-owned.
13. Jangan menyimpan full article tanpa kebutuhan.
14. Jangan menggunakan AI API sebagai dependency wajib.
15. Jangan mengirim notifikasi berulang untuk artikel yang sama.

## C.3 Code Quality

- TypeScript strict.
- Reusable components.
- Clear naming.
- Small and focused functions.
- Consistent error handling.
- No unnecessary abstraction.
- No unused dependencies.
- No hardcoded secrets.
- No unexplained `any`.
- No duplicated business logic.

## C.4 Phase Completion Report

Setiap AI Coding Assistant wajib menggunakan format:

```
PHASE COMPLETION REPORT

Project:
RSSFusion

Phase:
[PHASE NUMBER AND NAME]

STATUS:
Completed / Partially Completed / Blocked

1. IMPLEMENTATION SUMMARY

[What was implemented]

2. FILES CREATED

[List]

3. FILES MODIFIED

[List]

4. DEPENDENCIES ADDED

[List and reasons]

5. TESTING RESULTS

- Lint:
- Type checking:
- Build:
- Unit tests:
- Integration tests:
- E2E tests:

Only report tests that were actually executed.

6. ACCEPTANCE CRITERIA

- [x] Completed
- [ ] Not completed

7. KNOWN ISSUES

[List]

8. TECHNICAL DECISIONS

[List]

9. GIT STATUS

- Modified files:
- Commit created:
- Commit hash:

10. NEXT STEP

Do not automatically start the next phase.

Wait for explicit user approval.
```

---

# PART D — GIT & EXECUTION RULES

## D.1 Git Strategy

Branch utama:

```
main
```

Optional development branch:

```
develop
```

Untuk solo developer, bekerja langsung di main masih dapat diterima apabila setiap phase memiliki checkpoint yang jelas.

## D.2 Git Checkpoints

Setiap phase harus menghasilkan commit:

```
git commit -m "phase 1: project bootstrap"

git commit -m "phase 2: technical architecture"

git commit -m "phase 3: ui ux planning"

git commit -m "phase 4: frontend foundation"

git commit -m "phase 5: core frontend features"

git commit -m "phase 6: backend implementation"

git commit -m "phase 7: frontend backend integration"

git commit -m "phase 8: additional features"

git commit -m "phase 9: testing and optimization"

git commit -m "phase 10: production deployment"
```

## D.3 Commit Rules

Jangan melakukan commit apabila:

- Build gagal.
- Type checking gagal.
- Lint gagal.
- Perubahan belum direview.
- Ada secret yang masuk repository.
- Acceptance criteria utama belum terpenuhi.

Jika ada kegagalan yang diketahui dan tidak dapat diselesaikan, dokumentasikan terlebih dahulu dan jangan menandai phase sebagai completed.

## D.4 Phase Execution Workflow

```
START PHASE
    |
    v
READ PRD
    |
    v
READ TECHNICAL REFERENCES
    |
    v
INSPECT REPOSITORY
    |
    v
IMPLEMENT SCOPE
    |
    v
RUN TESTS
    |
    v
REVIEW CHANGES
    |
    v
CHECK ACCEPTANCE CRITERIA
    |
    v
CREATE GIT CHECKPOINT
    |
    v
REPORT COMPLETION
    |
    v
USER APPROVAL
    |
    v
NEXT PHASE
```

## D.5 Rollback Strategy

Jika suatu phase menghasilkan perubahan yang merusak:

```
git status
git log --oneline
```

Gunakan revert apabila perubahan sudah di-commit:

```
git revert COMMIT_HASH
```

Jangan menggunakan destructive reset tanpa memastikan perubahan yang belum di-commit tidak akan hilang.

---

# PART E — COMMAND CHEAT SHEET

## E.1 Development

```
npm install
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

## E.2 Git

```
git status
git add .
git commit -m "commit message"
git log --oneline
git diff
```

## E.3 Supabase

```
npx supabase init
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase migration new migration_name
npx supabase db push
```

## E.4 Worker

```
cd worker

npm install
npm run dev
npm run build
npm start
```

Script yang sesuai harus didefinisikan pada worker/package.json.

## E.5 Testing

```
npx vitest run
npx playwright test
npm run lint
npx tsc --noEmit
npm run build
npm audit
```

## E.6 Deployment

```
vercel
vercel --prod
```

## E.7 VPS Worker

```
sudo systemctl status rssfusion-worker

sudo systemctl restart rssfusion-worker

sudo systemctl stop rssfusion-worker

sudo systemctl start rssfusion-worker

sudo journalctl -u rssfusion-worker -f
```

---

# PART F — FINAL CHECKLIST & DOCUMENTATION

## F.1 Product Checklist

### Authentication

- Register.
- Login.
- Logout.
- Protected dashboard.
- User ownership.

### RSS Management

- Add source.
- Validate source.
- Edit source.
- Delete source.
- Enable/disable source.
- Feed health.

### RSS Processing

- Worker setup.
- Automatic scheduler.
- RSS fetching.
- RSS parsing.
- Article normalization.
- Deduplication.
- Retry mechanism.
- Error logging.

### Information Management

- Article listing.
- Search.
- Filters.
- Pagination.
- Topic management.
- Keyword management.
- Keyword matching.
- Saved articles.

### Supporting Features

- Dashboard statistics.
- Read status.
- Manual refresh.
- OPML import/export.
- Email notification.
- Trend analytics.

### Security

- Authentication.
- Authorization.
- RLS.
- SSRF protection.
- Rate limiting.
- Input validation.
- Environment security.

### Production

- Production database.
- Vercel deployment.
- VPS worker.
- Domain.
- HTTPS.
- Logging.
- Monitoring.
- Backup.
- Smoke testing.

## F.2 Required Documentation

Repository minimal harus memiliki:

```
rssfusion/
│
├── PROJECT_PRD_AND_PLAYBOOK.md
├── TECHNICAL_PLAN.md
├── UI_UX_GUIDE.md
├── TEST_REPORT.md
├── DEPLOYMENT_GUIDE.md
├── RELEASE_NOTES.md
├── README.md
├── .env.example
│
├── src/
│
├── worker/
│
├── supabase/
│
├── public/
│
├── package.json
│
└── tsconfig.json
```

## F.3 Definition of Done

RSSFusion MVP dinyatakan selesai apabila:

1. Pengguna dapat membuat akun.
2. Pengguna dapat menambahkan RSS source.
3. Sistem dapat memvalidasi RSS source.
4. Worker dapat mengambil artikel secara otomatis.
5. Artikel dapat tersimpan ke database.
6. Deduplication berfungsi.
7. Pengguna dapat membuat topic.
8. Pengguna dapat membuat keyword.
9. Artikel dapat dicocokkan dengan keyword.
10. Dashboard menampilkan artikel relevan.
11. Pengguna dapat mencari dan memfilter artikel.
12. Pengguna dapat menyimpan artikel.
13. Security dan ownership telah diverifikasi.
14. Worker berjalan pada production VPS.
15. Web application berjalan pada production.
16. Dokumentasi deployment tersedia.

## F.4 Recommended MVP Development Order

Walaupun keseluruhan development memiliki 10 phase, bagian yang paling berisiko secara teknis adalah RSS processing.

Oleh karena itu, perhatian khusus harus diberikan pada:

1. Phase 2 — Worker architecture.
2. Phase 6 — RSS ingestion engine.
3. Phase 7 — End-to-end integration.
4. Phase 9 — Reliability and security.

Jangan terlalu lama menyempurnakan UI sebelum memastikan RSS worker benar-benar dapat mengambil, memproses, dan menyimpan artikel.

## F.5 Final Product Vision

RSSFusion dibangun dengan dua tahap pemikiran produk:

**Stage 1 — RSS Aggregator**

Mengumpulkan artikel dari banyak sumber dalam satu dashboard.

**Stage 2 — Information Intelligence Platform**

Membantu pengguna memahami informasi yang sedang berkembang melalui:

- Topic monitoring.
- Keyword intelligence.
- Trend analysis.
- Competitor monitoring.
- Automatic summaries.
- Information discovery.
- AI-powered intelligence reports.

Stage 2 merupakan arah pengembangan produk, bukan bagian wajib MVP.

---

# END OF DOCUMENT

**RSSFusion – Information Intelligence**

Version: 1.0.0

Development Model: Solo Developer + AI Coding Assistant

Architecture: Next.js Modular Monolith + Dedicated Node.js RSS Worker

Database: Supabase PostgreSQL

Deployment: Vercel + VPS

Total Development Phases: **10**

**Development Rule: Complete → Verify → Review → Commit → Approve → Next Phase.**

## Rekomendasi pelaksanaan

Ada tiga keputusan teknis yang paling penting untuk RSSFusion:

1. Jangan menjalankan RSS fetching di Vercel. Gunakan Node.js worker pada VPS agar scheduler dan proses pengambilan artikel dapat berjalan secara persisten.
2. Gunakan PostgreSQL sebagai job scheduler pada MVP. Redis dan BullMQ belum diperlukan. Ini mengurangi biaya dan kompleksitas infrastruktur.
3. Prioritaskan RSS ingestion sebelum fitur intelligence. Pastikan pengambilan artikel, deduplication, dan keyword matching benar-benar stabil sebelum mengembangkan AI summarization atau sentiment analysis.

Dengan urutan tersebut, RSSFusion dapat diluncurkan sebagai RSS Aggregator terlebih dahulu, kemudian dikembangkan menjadi Information Intelligence Platform tanpa harus membangun ulang fondasi arsitekturnya.
