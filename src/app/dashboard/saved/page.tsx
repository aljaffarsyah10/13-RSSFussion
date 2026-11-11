"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ArticleCard } from "@/features/articles/components/article-card";
import { savedArticlesApi, articlesApi } from "@/lib/api/client";
import { Article } from "@/types/models";
import { Bookmark } from "lucide-react";

export default function SavedArticlesPage() {
  const [articles, setArticles] = React.useState<Article[]>([]);
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

    try {
      await articlesApi.markRead(articleId, newRead);
    } catch {
      setArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, isRead: target.isRead } : a))
      );
    }
  };

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
      />

      {articles.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved articles"
          description="Bookmark interesting articles from your feed to review or archive them here."
          actionLabel="Explore Articles Feed"
          actionHref="/dashboard/articles"
        />
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground pb-1">
            <span>
              {articles.length} bookmarked {articles.length === 1 ? "article" : "articles"}
            </span>
          </div>
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onToggleSave={handleToggleSave}
              onToggleRead={handleToggleRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
