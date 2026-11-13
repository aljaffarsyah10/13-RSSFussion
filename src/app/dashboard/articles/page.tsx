"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ArticleCard } from "@/features/articles/components/article-card";
import { ArticleFilters } from "@/features/articles/components/article-filters";
import { useFeedShortcuts } from "@/hooks/use-feed-shortcuts";
import { Button } from "@/components/ui/button";
import { articlesApi, sourcesApi, topicsApi } from "@/lib/api/client";
import { Article, RssSource, Topic } from "@/types/models";
import { Newspaper, Loader2 } from "lucide-react";

// Code splitting: dynamically import heavy dialogs
const ArticleReaderDialog = dynamic(
  () => import("@/features/articles/components/article-reader-dialog").then((m) => m.ArticleReaderDialog),
  { ssr: false }
);

const KeyboardShortcutsDialog = dynamic(
  () => import("@/components/shared/keyboard-shortcuts-dialog").then((m) => m.KeyboardShortcutsDialog),
  { ssr: false }
);

function ArticlesPageContent({ initialQuery }: { initialQuery: string }) {
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [sources, setSources] = React.useState<RssSource[]>([]);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [searchQuery, setSearchQuery] = React.useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = React.useState(initialQuery);
  const [selectedSourceId, setSelectedSourceId] = React.useState("");
  const [selectedTopic, setSelectedTopic] = React.useState("");
  const [readStatus, setReadStatus] = React.useState<"all" | "unread" | "read">("all");
  const [savedOnly, setSavedOnly] = React.useState(false);
  const [timeframe, setTimeframe] = React.useState<"all" | "today" | "3days" | "7days" | "30days">("all");
  const [sort, setSort] = React.useState<"newest" | "oldest" | "title-asc">("newest");
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);

  // Density & View
  const [density, setDensity] = React.useState<"comfortable" | "compact">(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("rssfusion_feed_density");
        if (saved === "compact" || saved === "comfortable") return saved;
      } catch {
        // ignore
      }
    }
    return "comfortable";
  });
  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  // Selection & bulk actions
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isMarkingAllRead, setIsMarkingAllRead] = React.useState(false);

  // Reader Modal
  const [activeReaderArticle, setActiveReaderArticle] = React.useState<Article | null>(null);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  const handleDensityChange = (d: "comfortable" | "compact") => {
    setDensity(d);
    try {
      localStorage.setItem("rssfusion_feed_density", d);
    } catch {
      // ignore
    }
  };

  // Debounce search query
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load sources and topics once
  React.useEffect(() => {
    Promise.all([
      sourcesApi.list().catch(() => []),
      topicsApi.list().catch(() => []),
    ]).then(([sList, tList]) => {
      setSources(sList || []);
      setTopics(tList || []);
    });
  }, []);

  // Fetch articles when filters change or reloadToken changes
  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await articlesApi.list({
          q: debouncedQuery || undefined,
          sourceId: selectedSourceId || undefined,
          topicId: selectedTopic || undefined,
          readStatus: readStatus !== "all" ? readStatus : undefined,
          savedOnly: savedOnly || undefined,
          timeframe: timeframe !== "all" ? timeframe : undefined,
          sort: sort !== "newest" ? sort : undefined,
          limit: 15,
        });

        if (!cancelled) {
          const items = res?.data || (Array.isArray(res) ? (res as unknown as Article[]) : []);
          setArticles(items);
          setNextCursor(res?.nextCursor ?? null);
          setSelectedIds(new Set());
          setFocusedIndex(0);
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load articles";
          setError(msg);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, selectedSourceId, selectedTopic, readStatus, savedOnly, timeframe, sort, reloadToken]);

  const handleRetry = () => {
    setIsLoading(true);
    setReloadToken((prev) => prev + 1);
  };

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const res = await articlesApi.list({
        q: debouncedQuery || undefined,
        sourceId: selectedSourceId || undefined,
        topicId: selectedTopic || undefined,
        readStatus: readStatus !== "all" ? readStatus : undefined,
        savedOnly: savedOnly || undefined,
        timeframe: timeframe !== "all" ? timeframe : undefined,
        sort: sort !== "newest" ? sort : undefined,
        cursor: nextCursor,
        limit: 15,
      });

      const newItems = res?.data || [];
      setArticles((prev) => [...prev, ...newItems]);
      setNextCursor(res?.nextCursor ?? null);
    } catch (err: unknown) {
      console.error("Failed to load more articles", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleToggleSave = React.useCallback(async (articleId: string) => {
    setArticles((prev) => {
      const target = prev.find((a) => a.id === articleId);
      if (!target) return prev;
      const newSaved = !target.isSaved;
      return prev.map((a) => (a.id === articleId ? { ...a, isSaved: newSaved } : a));
    });

    setActiveReaderArticle((prev) =>
      prev && prev.id === articleId ? { ...prev, isSaved: !prev.isSaved } : prev
    );

    const target = articles.find((a) => a.id === articleId);
    if (!target) return;
    const newSaved = !target.isSaved;

    try {
      if (newSaved) {
        await articlesApi.save(articleId);
      } else {
        await articlesApi.unsave(articleId);
      }
    } catch {
      setArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, isSaved: target.isSaved } : a))
      );
    }
  }, [articles]);

  const handleToggleRead = React.useCallback(async (articleId: string) => {
    setArticles((prev) => {
      const target = prev.find((a) => a.id === articleId);
      if (!target) return prev;
      const newRead = !target.isRead;
      return prev.map((a) => (a.id === articleId ? { ...a, isRead: newRead } : a));
    });

    setActiveReaderArticle((prev) =>
      prev && prev.id === articleId ? { ...prev, isRead: !prev.isRead } : prev
    );

    const target = articles.find((a) => a.id === articleId);
    if (!target) return;
    const newRead = !target.isRead;

    try {
      await articlesApi.markRead(articleId, newRead);
    } catch {
      setArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, isRead: target.isRead } : a))
      );
    }
  }, [articles]);

  const handleToggleSelect = React.useCallback((articleId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(articleId)) {
        next.delete(articleId);
      } else {
        next.add(articleId);
      }
      return next;
    });
  }, []);

  const handleToggleSelectAll = () => {
    if (selectedIds.size === articles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(articles.map((a) => a.id)));
    }
  };

  const handleBulkAction = async (action: "markRead" | "markUnread" | "save" | "unsave") => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    if (action === "markRead") {
      setArticles((prev) => prev.map((a) => (ids.includes(a.id) ? { ...a, isRead: true } : a)));
    } else if (action === "markUnread") {
      setArticles((prev) => prev.map((a) => (ids.includes(a.id) ? { ...a, isRead: false } : a)));
    } else if (action === "save") {
      setArticles((prev) => prev.map((a) => (ids.includes(a.id) ? { ...a, isSaved: true } : a)));
    } else if (action === "unsave") {
      setArticles((prev) => prev.map((a) => (ids.includes(a.id) ? { ...a, isSaved: false } : a)));
    }

    setSelectedIds(new Set());

    try {
      await articlesApi.bulk(action, ids);
    } catch {
      setReloadToken((prev) => prev + 1);
    }
  };

  const handleMarkAllFeedRead = async () => {
    setIsMarkingAllRead(true);
    try {
      await articlesApi.markAllRead({
        sourceId: selectedSourceId || undefined,
        topicId: selectedTopic || undefined,
      });
      setArticles((prev) => prev.map((a) => ({ ...a, isRead: true })));
    } catch (err: unknown) {
      console.error("Failed to mark all read", err);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  // Keyboard navigation shortcuts
  useFeedShortcuts({
    articles,
    focusedIndex,
    setFocusedIndex,
    onOpenReader: (a) => setActiveReaderArticle(a),
    onToggleSave: handleToggleSave,
    onToggleRead: handleToggleRead,
    onToggleSelect: handleToggleSelect,
    onFocusSearch: () => searchInputRef.current?.focus(),
    onOpenHelp: () => setShortcutsOpen(true),
    enabled: !activeReaderArticle && !shortcutsOpen,
  });

  const exportUrl = articlesApi.getExportUrl({
    q: debouncedQuery || undefined,
    sourceId: selectedSourceId || undefined,
    topicId: selectedTopic || undefined,
    readStatus: readStatus !== "all" ? readStatus : undefined,
    savedOnly: savedOnly || undefined,
    timeframe: timeframe !== "all" ? timeframe : undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Articles Feed"
        description="Browse, filter, and analyze aggregated intelligence from your publications."
      />

      {/* Filter toolbar */}
      <ArticleFilters
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setIsLoading(true);
          setSearchQuery(q);
        }}
        selectedSourceId={selectedSourceId}
        onSourceChange={(s) => {
          setIsLoading(true);
          setSelectedSourceId(s);
        }}
        selectedTopic={selectedTopic}
        onTopicChange={(t) => {
          setIsLoading(true);
          setSelectedTopic(t);
        }}
        readStatus={readStatus}
        onReadStatusChange={(st) => {
          setIsLoading(true);
          setReadStatus(st);
        }}
        savedOnly={savedOnly}
        onSavedOnlyChange={(saved) => {
          setIsLoading(true);
          setSavedOnly(saved);
        }}
        timeframe={timeframe}
        onTimeframeChange={(tf) => {
          setIsLoading(true);
          setTimeframe(tf);
        }}
        sort={sort}
        onSortChange={(s) => {
          setIsLoading(true);
          setSort(s);
        }}
        availableSources={sources.map((s) => ({ id: s.id, name: s.name }))}
        availableTopics={topics.map((t) => ({ id: t.id, name: t.name }))}
        totalCount={articles.length}
        selectedCount={selectedIds.size}
        onToggleSelectAll={handleToggleSelectAll}
        isAllSelected={articles.length > 0 && selectedIds.size === articles.length}
        onBulkAction={handleBulkAction}
        onMarkAllFeedRead={handleMarkAllFeedRead}
        isMarkingAllRead={isMarkingAllRead}
        exportUrl={exportUrl}
        density={density}
        onDensityChange={handleDensityChange}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        searchInputRef={searchInputRef}
      />

      {/* Body state */}
      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : error ? (
        <ErrorState
          title="Unable to load articles"
          description={error}
          onRetry={handleRetry}
        />
      ) : articles.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No articles match your filters"
          description={
            sources.length === 0
              ? "Connect RSS sources first to begin populating your article intelligence stream."
              : "Try broadening your search term or clearing the source/topic filters."
          }
          actionLabel={sources.length === 0 ? "Connect RSS Sources" : "Clear Filters"}
          actionHref={sources.length === 0 ? "/dashboard/sources" : undefined}
          onAction={
            sources.length === 0
              ? undefined
              : () => {
                  setIsLoading(true);
                  setSearchQuery("");
                  setSelectedSourceId("");
                  setSelectedTopic("");
                  setReadStatus("all");
                  setSavedOnly(false);
                  setTimeframe("all");
                  setSort("newest");
                }
          }
        />
      ) : (
        <div className={density === "compact" ? "space-y-1.5" : "space-y-3"}>
          {articles.map((article, idx) => (
            <ArticleCard
              key={article.id}
              article={article}
              selectable={true}
              isSelected={selectedIds.has(article.id)}
              isFocused={focusedIndex === idx}
              density={density}
              onToggleSelect={handleToggleSelect}
              onToggleSave={handleToggleSave}
              onToggleRead={handleToggleRead}
              onOpenReader={(a) => {
                setFocusedIndex(idx);
                setActiveReaderArticle(a);
              }}
            />
          ))}

          {nextCursor && (
            <div className="pt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="h-9 px-6 text-xs gap-1.5 cursor-pointer shadow-2xs"
              >
                {isLoadingMore && <Loader2 className="size-3.5 animate-spin" />}
                <span>
                  {isLoadingMore ? "Loading more articles..." : "Load More Articles"}
                </span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Reader Modal */}
      <ArticleReaderDialog
        article={activeReaderArticle}
        isOpen={Boolean(activeReaderArticle)}
        onClose={() => setActiveReaderArticle(null)}
        onToggleSave={handleToggleSave}
        onToggleRead={handleToggleRead}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </div>
  );
}

function ArticlesPageWithSearchParams() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  return <ArticlesPageContent key={initialQuery} initialQuery={initialQuery} />;
}

export default function ArticlesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-6">
          <PageHeader
            title="Articles Feed"
            description="Browse, filter, and analyze aggregated intelligence from your publications."
          />
          <LoadingSkeleton count={4} />
        </div>
      }
    >
      <ArticlesPageWithSearchParams />
    </React.Suspense>
  );
}
