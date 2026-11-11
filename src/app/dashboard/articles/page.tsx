"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ArticleCard } from "@/features/articles/components/article-card";
import { ArticleFilters } from "@/features/articles/components/article-filters";
import { Button } from "@/components/ui/button";
import { articlesApi, sourcesApi, topicsApi } from "@/lib/api/client";
import { Article, RssSource, Topic } from "@/types/models";
import { Newspaper, Loader2 } from "lucide-react";

function ArticlesPageContent({ initialQuery }: { initialQuery: string }) {
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [sources, setSources] = React.useState<RssSource[]>([]);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [searchQuery, setSearchQuery] = React.useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = React.useState(initialQuery);
  const [selectedSourceId, setSelectedSourceId] = React.useState("");
  const [selectedTopic, setSelectedTopic] = React.useState("");
  const [readStatus, setReadStatus] = React.useState<"all" | "unread" | "read">("all");
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

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
          limit: 15,
        });

        if (!cancelled) {
          const items = res?.data || (Array.isArray(res) ? (res as unknown as Article[]) : []);
          setArticles(items);
          setNextCursor(res?.nextCursor ?? null);
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
  }, [debouncedQuery, selectedSourceId, selectedTopic, readStatus, reloadToken]);

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

  const handleToggleSave = async (articleId: string) => {
    const target = articles.find((a) => a.id === articleId);
    if (!target) return;

    const newSaved = !target.isSaved;

    // Optimistic update
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, isSaved: newSaved } : a))
    );

    try {
      if (newSaved) {
        await articlesApi.save(articleId);
      } else {
        await articlesApi.unsave(articleId);
      }
    } catch {
      // Revert on failure
      setArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, isSaved: target.isSaved } : a))
      );
    }
  };

  const handleToggleRead = async (articleId: string) => {
    const target = articles.find((a) => a.id === articleId);
    if (!target) return;

    const newRead = !target.isRead;

    // Optimistic update
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, isRead: newRead } : a))
    );

    try {
      await articlesApi.markRead(articleId, newRead);
    } catch {
      // Revert on failure
      setArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, isRead: target.isRead } : a))
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Articles Feed"
        description="Browse and filter aggregated stories from your followed publications."
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
        availableSources={sources.map((s) => ({ id: s.id, name: s.name }))}
        availableTopics={topics.map((t) => ({ id: t.id, name: t.name }))}
        totalCount={articles.length}
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
                }
          }
        />
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onToggleSave={handleToggleSave}
              onToggleRead={handleToggleRead}
            />
          ))}

          {nextCursor && (
            <div className="pt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="h-9 px-6 text-xs gap-1.5 cursor-pointer"
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
            description="Browse and filter aggregated stories from your followed publications."
          />
          <LoadingSkeleton count={4} />
        </div>
      }
    >
      <ArticlesPageWithSearchParams />
    </React.Suspense>
  );
}
