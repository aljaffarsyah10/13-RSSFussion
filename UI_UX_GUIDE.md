# RSSFusion — UI/UX Guide & Design System Specification (Phase 3)

**Document:** `UI_UX_GUIDE.md`  
**Product:** RSSFusion – Information Intelligence  
**Version:** 1.0.0 (Phase 3 Blueprint)  
**Status:** Approved for Implementation  
**Audience:** Frontend Engineers, UI/UX Designers, AI Coding Assistants  

---

## 1. Design Direction & Product Philosophy

RSSFusion is an **Information Intelligence Platform** tailored for professionals (researchers, journalists, marketers, analysts). The UI must balance **high information density** with **visual serenity**, minimizing cognitive fatigue caused by information overload.

### 1.1 Reference Aesthetics & Inspiration
- **Linear**: Fluid keyboard-first navigation, restrained borders, crisp typography hierarchy, subtle micro-interactions.
- **Feedly & Readwise Reader**: Comfortable reading column widths, uncluttered article typography, clear source provenance, single-click save/read actions.
- **Notion**: Calming neutrals, intentional iconography, clean card surfaces with modular content.

### 1.2 Core Design Principles
1. **Content First**: RSS feeds and summaries take precedence. Surrounding chrome (sidebars, toolbars) remains subordinate and unobtrusive.
2. **Dense yet Scannable**: Use tight, consistent vertical rhythm and strong typographic contrast so users can scan 50+ headlines rapidly.
3. **Calm & Focused**: Avoid garish colors or heavy drop-shadows. Rely on subtle border lines (`oklch/neutral`), soft surface fills, and deliberate accent colors.
4. **Predictable Feedback**: Every action (fetch, save, filter, topic tag) provides deterministic states: Instant skeleton -> dynamic feedback -> polite toast notification.

---

## 2. Visual Identity & Design Tokens

RSSFusion builds on standard Tailwind CSS v4 and shadcn/ui design tokens (`base-neutral` theme with OKLCH CSS variables in `src/app/globals.css`).

### 2.1 Color Palette & Semantic Tokens

| Token | Light Mode (OKLCH) | Dark Mode (OKLCH) | Semantic Purpose |
| :--- | :--- | :--- | :--- |
| `--background` | `oklch(1 0 0)` (#ffffff) | `oklch(0.145 0 0)` (#171717) | App background |
| `--foreground` | `oklch(0.145 0 0)` (#171717) | `oklch(0.985 0 0)` (#fafafa) | Default body text |
| `--card` / `--surface` | `oklch(1 0 0)` | `oklch(0.205 0 0)` | Cards, dialogs, popovers |
| `--primary` | `oklch(0.205 0 0)` (#262626) | `oklch(0.922 0 0)` (#ebebeb) | Primary buttons, active indicators |
| `--primary-accent` | `oklch(0.55 0.22 265)` (Indigo) | `oklch(0.65 0.20 265)` (Indigo) | Brand highlights, keyword badges, active tabs |
| `--secondary` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Secondary buttons, subtle pill tags |
| `--muted-foreground` | `oklch(0.556 0 0)` (#737373) | `oklch(0.708 0 0)` (#a3a3a3) | Timestamps, metadata, feed URLs |
| `--border` | `oklch(0.922 0 0)` (#e5e5e5) | `oklch(0.269 0 0)` (#2e2e2e) | Dividers, card strokes, inputs |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.63 0.24 25.0)` | Unsubscribe, delete, critical errors |
| `--success` | `oklch(0.62 0.19 145)` (Emerald) | `oklch(0.70 0.18 145)` (Emerald) | Feed healthy, sync completed |
| `--warning` | `oklch(0.75 0.16 75)` (Amber) | `oklch(0.80 0.15 75)` (Amber) | Stale feed, approaching quota |

### 2.2 Typography Scale

Using default Next.js Geist / Inter sans-serif font family.

| Role | Class / Size | Weight | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | `text-2xl` / 24px (1.5rem) | 700 (Bold) | 1.25 | `-0.02em` | Dashboard greeting, Auth headlines |
| **Section Title** | `text-lg` / 18px (1.125rem) | 600 (Semibold) | 1.35 | `-0.01em` | Card headers, table titles |
| **Article Title** | `text-base` / 16px (1.0rem) | 600 (Semibold) | 1.40 | `-0.005em` | Article headline link |
| **Body / Snippet** | `text-sm` / 14px (0.875rem) | 400 (Regular) | 1.50 | `normal` | Article description snippet, modal copy |
| **Caption / Meta** | `text-xs` / 12px (0.75rem) | 500 (Medium) | 1.40 | `+0.01em` | Source badge, published time, author |
| **Code / Monospace** | `text-xs` font-mono | 400 (Regular) | 1.40 | `normal` | RSS URLs, GUIDs, JSON error details |

---

## 3. Spacing & Layout Architecture

### 3.1 Spacing Rhythm
- **Base Grid**: 4px standard (`p-1` = 4px, `p-2` = 8px, `p-3` = 12px, `p-4` = 16px, `p-6` = 24px).
- **Component Padding**:
  - Compact cards (Article items): `p-4` (16px) or `p-5` (20px).
  - Modal Dialogs: `p-6` (24px).
  - Section Spacing: `gap-6` (24px) between dashboard widgets.

### 3.2 Global Layout Structure

```
+-------------------------------------------------------------------------------+
| App Header / Topbar (h-14, sticky top, border-b, search + user menu)         |
+-------------------+-----------------------------------------------------------+
| Sidebar (w-60)    | Main Content Canvas (flex-1, p-6 or p-8, overflow-y-auto) |
| - Workspace Brand |                                                           |
| - Navigation Menu | Page Title + Action Toolbar (Add Source, Refresh)         |
| - Topics List     | +-------------------------------------------------------+ |
| - Quota Indicator | | Content Area (Article Feed, Table, or Grid Cards)     | |
| - User Footer     | +-------------------------------------------------------+ |
+-------------------+-----------------------------------------------------------+
```

1. **Public Layout (`src/app/(public)`)**:
   - Clean top navbar (`/`, `/pricing`, `/terms`, `/privacy`) with "Sign In" and "Get Started" CTA buttons.
   - Max width `max-w-6xl mx-auto px-4`.
2. **Auth Layout (`src/app/(auth)`)**:
   - Centered card container (`max-w-md w-full mx-auto`), minimal branding, clear OAuth/Credentials toggle.
3. **Dashboard Layout (`src/app/dashboard`)**:
   - Left Sidebar: `w-60` (240px) fixed on desktop (`hidden md:flex`), collapsible to mobile drawer sheet.
   - Topbar: `h-14` (56px) border-b, includes breadcrumb/title, global search trigger, quota pill, theme toggle, and profile avatar.
   - Main Canvas: `min-h-[calc(100vh-3.5rem)]`, content wrapper `max-w-7xl mx-auto p-4 sm:p-6 lg:p-8`.

---

## 4. Navigation & Information Architecture

### 4.1 Sidebar Specification (`AppSidebar`)
- **Brand**: RSSFusion icon mark + "RSSFusion" wordmark + version badge ("v1.0").
- **Primary Nav items** (Lucide icons):
  1. `Overview` (`LayoutDashboard`) -> `/dashboard`
  2. `Feed / Articles` (`Rss` or `Newspaper`) -> `/dashboard/articles`
  3. `Sources` (`Globe`) -> `/dashboard/sources`
  4. `Topics` (`FolderTree`) -> `/dashboard/topics`
  5. `Keywords` (`Tag`) -> `/dashboard/keywords`
  6. `Saved Articles` (`Bookmark`) -> `/dashboard/saved`
  7. `Settings` (`Settings`) -> `/dashboard/settings`
- **Bottom Section**:
  - **Quota Progress Pill**: Mini progress bar showing `X / 5 Sources` (Free Plan) with subtle "Upgrade" link.
  - **User Profile Row**: User avatar, email/name, logout action button.

### 4.2 Topbar Specification (`DashboardHeader`)
- Left: Mobile hamburger trigger (`SheetTrigger`) + Breadcrumb hierarchy (`Dashboard > Articles`).
- Center/Right: Quick Search bar (`Ctrl+K` shortcut hint) + Refresh button + User dropdown.

---

## 5. Main Screen Blueprints & Wireframes

### 5.1 Dashboard Overview (`/dashboard`)
- **Hero / Stat Row (4 Columns on Desktop, 2 on Tablet, 1 on Mobile)**:
  - `Total Active Sources` (StatCard with health badge indicator).
  - `Articles Today` (StatCard with count fetched in the last 24h).
  - `Tracked Topics` (StatCard with active topic count).
  - `Saved Articles` (StatCard with total bookmarks).
- **Split Content Area (2 Columns, 8 : 4 grid ratio)**:
  - **Left (8 cols)**: "Recent Highlights" — Feed of top 5-10 latest articles matching monitored keywords.
  - **Right (4 cols)**:
    - "Monitored Topics & Keywords" widget (quick link to topics).
    - "Source Health Status" card (summarizes active vs erroring feeds).

### 5.2 Article Feed (`/dashboard/articles`)
- **Header Toolbar**:
  - Search input with debounce.
  - Filter chips: `All Sources`, `Topic Dropdown`, `Keyword Dropdown`, `Date Range Filter`.
  - Sort selector: `Newest First` (default) vs `Oldest First`.
- **Feed Container**:
  - Vertical list of `ArticleCard` items with 12px gap (`space-y-3`).
  - Density toggle: Compact mode (headline + source + date only) vs Comfortable mode (includes description snippet and thumbnail image).
- **Pagination**:
  - "Load More" cursor-based button with loading spinner, or numbered cursor pagination bar.

### 5.3 Source Management (`/dashboard/sources`)
- **Header**: Title, count badge, and "Add RSS Source" primary button (opens modal).
- **Source List / Cards**:
  - Table or Card Grid displaying:
    - Source Favicon/Icon + Feed Name + Site URL.
    - Status Badge: `Healthy` (green dot), `Pending Fetch` (gray dot), `Error` (red dot + tooltip with `last_error`).
    - Schedule Info: `Last Fetched: 5m ago`, `Next: in 55m`.
    - Health counters: Failures count, fetch latency.
    - Quick actions: Manual Refresh (`RefreshCw`), Toggle Enabled (`Switch`), Edit, Delete.
- **Add Source Dialog (`SourceForm`)**:
  - Feed URL input with real-time "Validate" button.
  - Validation preview box: shows extracted title, site URL, and recent 3 articles preview.
  - Fetch Interval selector (`15m`, `30m`, `1h`, `6h`, `24h`).
  - Quota notification banner if user reached plan limit.

### 5.4 Topics & Keyword Management (`/dashboard/topics` & `/dashboard/keywords`)
- **Topic Cards**:
  - Name, description, associated keyword chips (e.g. `[AI]`, `[Next.js]`, `[PostgreSQL]`).
  - "Articles Matched" count badge.
  - Edit and Delete topic dialogs.
- **Keyword Input (`KeywordInput`)**:
  - Tag-input style field allowing fast multi-keyword addition.
  - Case-insensitive exact match explanation banner.

### 5.5 Saved Articles (`/dashboard/saved`)
- Similar list view to Article Feed, but filtered specifically to `saved_articles`.
- Each card has an active "Unsave" bookmark toggle.
- Empty state: "No saved articles yet. Bookmark articles from your feed to review them later."

---

## 6. Article Card Specification (`ArticleCard`)

The centerpiece of the reading experience.

```
+----------------------------------------------------------------------------------+
| [Favicon] TechCrunch  •  12 minutes ago  •  by Alex Wilhelm        [Bookmark] [Share]
|----------------------------------------------------------------------------------|
| Supabase Launches Native Edge Vector Search Architecture                         |
|----------------------------------------------------------------------------------|
| Open source database platform Supabase announced today a major upgrade to their   |
| managed pgvector engine, enabling sub-millisecond retrieval across millions...   |
|----------------------------------------------------------------------------------|
| [Pill: #Database] [Pill: #AI]                               [Open Original Link ↗] |
+----------------------------------------------------------------------------------+
```

### 6.1 Elements & Micro-interactions
1. **Header Metadata**:
   - Favicon fallback / Source Name (bold, clickable to filter by source).
   - Relative timestamp (e.g., "15m ago" via `date-fns` or native formatter).
   - Author name (if present).
   - Action icons: Bookmark toggle (`BookmarkFilled` vs `BookmarkEmpty`), External link.
2. **Title**:
   - Semibold, `hover:underline`, links directly to original article in new tab (`rel="noopener noreferrer nofollow"`).
3. **Snippet**:
   - Plain text (stripped of HTML/XSS), 2-line clamp (`line-clamp-2`), muted foreground color.
4. **Thumbnail (Optional)**:
   - When present, rendered on the right side (`w-24 h-24 object-cover rounded-md flex-shrink-0`).
   - Hidden on small mobile screens to conserve vertical height.
5. **Footer Tags**:
   - Keyword match pills (e.g., `#Supabase`, `#Vector`) with subtle accent tint.
   - Read status indicator (dimmed background when already read).

---

## 7. Component Inventory & Specification

All components use shadcn/ui primitives stored in `src/components/ui/` with custom wrappers in `src/components/` and `src/features/`.

| Component Name | File Path | Props & Key Responsibilities |
| :--- | :--- | :--- |
| `AppSidebar` | `src/components/layout/app-sidebar.tsx` | Main navigation, active route highlights, quota mini-bar. |
| `DashboardHeader` | `src/components/layout/dashboard-header.tsx` | Top breadcrumbs, global search trigger, mobile drawer toggle. |
| `DashboardShell` | `src/components/layout/dashboard-shell.tsx` | Responsive flex wrapper for sidebar + main scrollable view. |
| `StatCard` | `src/components/shared/stat-card.tsx` | Metric number, icon, trend/comparison, sub-label. |
| `EmptyState` | `src/components/shared/empty-state.tsx` | Visual icon, title, description, primary CTA button. |
| `ErrorState` | `src/components/shared/error-state.tsx` | Alert icon, error message, retry action button. |
| `LoadingSkeleton` | `src/components/shared/loading-skeleton.tsx` | Configurable skeleton for article lists, tables, and metric cards. |
| `Pagination` | `src/components/shared/pagination.tsx` | Cursor "Load More" button with loading spinner, or next/prev bar. |
| `ConfirmDialog` | `src/components/shared/confirm-dialog.tsx` | Destructive action confirmation (Delete source, delete topic). |
| `ArticleCard` | `src/features/articles/components/article-card.tsx` | Headline, source, timestamp, snippet, topic pills, bookmark button. |
| `ArticleList` | `src/features/articles/components/article-list.tsx` | Container for list of ArticleCards with loading and empty fallbacks. |
| `ArticleFilters` | `src/features/articles/components/article-filters.tsx` | Source dropdown, topic filter, date range picker. |
| `SourceCard` | `src/features/sources/components/source-card.tsx` | Source overview, fetch interval, health badge, manual refresh. |
| `SourceForm` | `src/features/sources/components/source-form.tsx` | Dialog form to validate and insert a new RSS/Atom feed. |
| `SourceStatusBadge` | `src/features/sources/components/source-status-badge.tsx` | Semantic color badge (`Healthy`, `Stale`, `Error`, `Disabled`). |
| `TopicCard` | `src/features/topics/components/topic-card.tsx` | Topic title, description, keyword badges, article counter. |
| `TopicForm` | `src/features/topics/components/topic-form.tsx` | Create/edit topic with name and description. |
| `KeywordInput` | `src/features/keywords/components/keyword-input.tsx` | Interactive pill-tag input for creating and deleting keywords. |

---

## 8. UX States Specification

Every feature screen and interactive component must explicitly handle 5 standard states:

### 8.1 Loading State
- **Initial Page Load**: Do not use full-screen blank spinners. Render structural pulse skeletons matching the destination card/table geometry (`LoadingSkeleton`).
- **Button In-Flight**: Disable the button, replace leading icon with a spinning `Loader2` icon (e.g., "Validating...", "Saving...").
- **Incremental Fetching (Pagination)**: Keep existing items visible; show skeleton rows at the bottom of the feed.

### 8.2 Empty State
- Never leave a blank canvas. Always render `EmptyState` with:
  - An expressive Lucide illustration icon with muted background (`bg-muted/50 p-4 rounded-full`).
  - Clear heading explaining the void (e.g., *"No RSS Sources Connected"*).
  - Friendly explanation paragraph (e.g., *"Add your first news feed or blog to begin aggregating articles automatically."*).
  - Prominent Action Button (e.g., `+ Add RSS Source`).

### 8.3 Error State
- **Inline / Feed Errors**: Render `ErrorState` with human-readable error messages (never raw SQL or stack traces) and a "Try Again" (`RotateCw`) button.
- **Form Validation Errors**: Show inline red field helper text (`text-destructive text-xs`) linked via `aria-describedby`.
- **Critical / 404 / 500 Pages**: Clean Next.js error boundary (`error.tsx`) with option to return to Dashboard.

### 8.4 Success State
- Transient actions (e.g., "Source added", "Article saved", "Topic updated") trigger a subtle toast notification at bottom-right (`sonner` or shadcn toast).
- Modal forms automatically close upon success and invalidate/refresh list data.

### 8.5 Disabled / Quota Exceeded State
- When a user on the Free Plan hits the quota (e.g. 5 sources), the "Add Source" button remains visible but opening the modal displays a **Quota Limit Banner**:
  - Warning alert styling: *"You've reached your limit of 5 RSS sources on the Free Plan."*
  - The submit button is disabled.
  - A friendly link or CTA directs user to upgrade options.

---

## 9. Responsive Behavior & Breakpoints

Standard Tailwind CSS breakpoints:
- `sm`: 640px (Large phones)
- `md`: 768px (Tablets / Foldables)
- `lg`: 1024px (Laptops / Small Desktops)
- `xl`: 1280px (Standard Desktops)

### 9.1 Desktop Layout (`>= 1024px`)
- Permanent sidebar (240px wide).
- Dual/multi-column stat cards (4 across).
- Article list has comfortable reading line-length (`max-w-4xl`).
- Filter bar sits inline on a single horizontal row.

### 9.2 Tablet Layout (`768px - 1023px`)
- Permanent compact sidebar or full sidebar depending on screen width.
- Stat cards collapse to 2 columns.
- Modals scale to `max-w-lg`.

### 9.3 Mobile Layout (`< 768px`)
- Sidebar hidden; accessible via slide-over drawer (`Sheet` component) triggered by hamburger icon in Topbar.
- Article cards adopt full viewport width (`px-3 py-3.5`).
- Thumbnail image on Article Cards hidden or moved below text.
- Filter toolbar collapses into a single "Filters" dropdown button opening a bottom sheet.
- Minimum tap target of 44x44px on all buttons and touch elements.

---

## 10. Accessibility (a11y) Standards

1. **Semantic Hierarchy**: Strict usage of `<main>`, `<nav>`, `<header>`, `<article>`, and heading order (`h1` -> `h2` -> `h3`).
2. **Keyboard Navigation**:
   - `Tab` / `Shift+Tab` cycles naturally through inputs and actions.
   - Esc closes all open modals, dialogs, and mobile drawers.
   - Focus rings: All interactive elements feature visible `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.
3. **Contrast Ratio**:
   - All body text meets WCAG AA standard (minimum 4.5:1 contrast against background).
   - Metadata and muted text maintains at least 3:1 contrast.
4. **Screen Reader Support**:
   - Icon-only buttons (Bookmark, Delete, Refresh) include `aria-label` (e.g. `aria-label="Save article"`).
   - Form inputs paired with `<Label htmlFor="...">`.
5. **No Motion Sickness**: Respect user preferences with `@media (prefers-reduced-motion)` via Tailwind's `motion-safe` / `motion-reduce`.

---

## 11. Implementation Roadmap for Phase 4 & Phase 5

- **Phase 4 Target**: Scaffold Application Shell (`src/app/dashboard/layout.tsx`, `AppSidebar`, `DashboardHeader`, empty/loading states, mock navigation).
- **Phase 5 Target**: Implement full interactive mock screens using the component inventory (`ArticleCard`, `SourceCard`, `TopicCard`, `SourceForm`, filters).

---

*End of UI/UX Guide — RSSFusion Phase 3*
