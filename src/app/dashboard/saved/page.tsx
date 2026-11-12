"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ArticleCard } from "@/features/articles/components/article-card";
import { ArticleReaderDialog } from "@/features/articles/components/article-reader-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { savedArticlesApi, articlesApi } from "@/lib/api/client";
import { Article } from "@/types/models";
import {
  Bookmark,
  Search,
  X,
  Download,
  CheckCircle2,
  CheckSquare,
  Square,
  Trash2,
} from "lucide-react";

export default function SavedArticlesPage() {
  const [articles, setArticles] = React.useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTopic, setSelectedTopic] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState<"newest" | "oldest" | "title-asc">("newest");

  // Selection
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Reader Modal
  const [activeReaderArticle, setActiveReaderArticle] = React.useState<Article | null>(null);
  const [showExportMenu, setShowExportMenu] = React.useState(false);

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const items = await savedArticlesApi.list();
        if (!cancelled) {
          setArticles(items || []);
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load saved articles";
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
  }, [reloadToken]);

  const handleRetry = () => {
    setIsLoading(true);
    setReloadToken((prev) => prev + 1);
  };

  const handleToggleSave = async (articleId: string) => {
    const previous = articles;
    setArticles((prev) => prev.filter((a) => a.id !== articleId));
    if (activeReaderArticle?.id === articleId) {
      setActiveReaderArticle(null);
    }

    try {
      await savedArticlesApi.unsave(articleId);
    } catch {
      setArticles(previous);
    }
  };

  const handleToggleRead = async (articleId: string) => {
    const target = articles.find((a) => a.id === articleId);
    if (!target) return;

    const newRead = !target.isRead;
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, isRead: newRead } : a))
    );
    if (activeReaderArticle?.id === articleId) {
      setActiveReaderArticle((prev) => prev ? { ...prev, isRead: newRead } : null);
    }

    try {
      await articlesApi.markRead(articleId, newRead);
    } catch {
      setArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, isRead: target.isRead } : a))
      );
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = (filteredCount: number, filteredIds: string[]) => {
    if (selectedIds.size === filteredCount) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIds));
    }
  };

  const handleBulkAction = async (action: "unsave" | "markRead" | "markUnread") => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    if (action === "unsave") {
      setArticles((prev) => prev.filter((a) => !ids.includes(a.id)));
    } else if (action === "markRead") {
      setArticles((prev) => prev.map((a) => ids.includes(a.id) ? { ...a, isRead: true } : a));
    } else if (action === "markUnread") {
      setArticles((prev) => prev.map((a) => ids.includes(a.id) ? { ...a, isRead: false } : a));
    }

    setSelectedIds(new Set());

    try {
      await articlesApi.bulk(action, ids);
    } catch {
      setReloadToken((prev) => prev + 1);
    }
  };

  // Distinct topics from saved articles
  const availableTopics = React.useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => a.topics?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [articles]);

  // Filtered & sorted list
  const filteredArticles = React.useMemo(() => {
    let result = articles;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q)) ||
          a.sourceName.toLowerCase().includes(q) ||
          a.matchedKeywords?.some((k) => k.toLowerCase().includes(q))
      );
    }

    if (selectedTopic) {
      result = result.filter((a) => a.topics?.includes(selectedTopic));
    }

    if (sortOrder === "oldest") {
      result = [...result].sort(
        (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      );
    } else if (sortOrder === "title-asc") {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result = [...result].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    }

    return result;
  }, [articles, searchQuery, selectedTopic, sortOrder]);

  const exportUrl = articlesApi.getExportUrl({ savedOnly: true });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Saved Articles"
          description="Your personal knowledge repository of bookmarked stories and research."
        />
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Saved Articles"
          description="Your personal knowledge repository of bookmarked stories and research."
        />
        <ErrorState
          title="Unable to load saved articles"
          description={error}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved Articles"
        description="Your personal knowledge repository of bookmarked stories and research."
      >
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportMenu((v) => !v)}
            disabled={articles.length === 0}
            className="h-8 gap-1.5 text-xs shadow-2xs cursor-pointer"
          >
            <Download className="size-3.5" />
            <span>Export Saved</span>
          </Button>

          {showExportMenu && (
            <div
              className="absolute right-0 top-full mt-1.5 z-30 w-48 rounded-xl border border-border/80 bg-popover p-1.5 shadow-lg backdrop-blur-md animate-in fade-in-50 zoom-in-95"
              onClick={() => setShowExportMenu(false)}
            >
              <a
                href={`${exportUrl}&format=csv`}
                download
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-popover-foreground hover:bg-muted/70 transition-colors"
              >
                <Download className="size-3.5 text-muted-foreground" />
                <span>Export as CSV</span>
              </a>
              <a
                href={`${exportUrl}&format=markdown`}
                download
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-popover-foreground hover:bg-muted/70 transition-colors"
              >
                <Download className="size-3.5 text-muted-foreground" />
                <span>Export Markdown (.md)</span>
              </a>
              <a
                href={`${exportUrl}&format=json`}
                download
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-popover-foreground hover:bg-muted/70 transition-colors"
              >
                <Download className="size-3.5 text-muted-foreground" />
                <span>Export as JSON</span>
              </a>
            </div>
          )}
        </div>
      </PageHeader>

      {articles.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved articles yet"
          description="Bookmark interesting articles from your feed to review, research, or archive them here."
          actionLabel="Explore Articles Feed"
          actionHref="/dashboard/articles"
        />
      ) : (
        <div className="space-y-4">
          {/* Filter Bar for Saved Articles */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center rounded-xl border border-border/80 bg-card/80 p-3 shadow-2xs backdrop-blur-xs">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved articles..."
                className="h-8.5 pl-8 pr-7 text-xs bg-muted/30 border-border/70 focus-visible:bg-background transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {availableTopics.length > 0 && (
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="h-8.5 rounded-lg border border-border/80 bg-background/80 px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer shadow-2xs"
                >
                  <option value="">All Topics</option>
                  {availableTopics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest" | "title-asc")}
                className="h-8.5 rounded-lg border border-border/80 bg-background/80 px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer shadow-2xs"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title-asc">Title (A-Z)</option>
              </select>

              {(searchQuery || selectedTopic || sortOrder !== "newest") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedTopic("");
                    setSortOrder("newest");
                  }}
                  className="h-8.5 text-xs text-muted-foreground hover:text-foreground px-2 cursor-pointer"
                >
                  <X className="size-3.5 mr-1" />
                  <span>Reset</span>
                </Button>
              )}
            </div>
          </div>

          {/* Bulk Selection Bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-card/95 p-2.5 px-4 shadow-md backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() =>
                    handleToggleSelectAll(
                      filteredArticles.length,
                      filteredArticles.map((a) => a.id)
                    )
                  }
                  className="h-7 text-xs gap-1.5 cursor-pointer text-foreground font-medium"
                >
                  {selectedIds.size === filteredArticles.length ? (
                    <CheckSquare className="size-3.5 text-primary" />
                  ) : (
                    <Square className="size-3.5 text-muted-foreground" />
                  )}
                  <span>{selectedIds.size} selected</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleBulkAction("markRead")}
                  className="h-7 text-xs gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="size-3 text-emerald-500" />
                  <span>Mark Read</span>
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleBulkAction("unsave")}
                  className="h-7 text-xs gap-1 text-destructive hover:text-destructive cursor-pointer"
                >
                  <Trash2 className="size-3" />
                  <span>Remove Selected</span>
                </Button>
              </div>
            </div>
          )}

          {/* Results count */}
          <div className="text-xs text-muted-foreground px-1 flex items-center justify-between">
            <span>
              Showing {filteredArticles.length} of {articles.length} bookmarked{" "}
              {articles.length === 1 ? "article" : "articles"}
            </span>
          </div>

          {/* Cards List */}
          {filteredArticles.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground rounded-xl border border-dashed border-border/80">
              No saved articles match your search or topic filter.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  selectable={true}
                  isSelected={selectedIds.has(article.id)}
                  onToggleSelect={handleToggleSelect}
                  onToggleSave={handleToggleSave}
                  onToggleRead={handleToggleRead}
                  onOpenReader={(a) => setActiveReaderArticle(a)}
                />
              ))}
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
    </div>
  );
}
