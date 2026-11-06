"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ArticleCard } from "@/features/articles/components/article-card";
import { initialMockArticles } from "@/features/articles/mocks/articles.mock";
import { Bookmark } from "lucide-react";

export default function SavedArticlesPage() {
  const [articles, setArticles] = React.useState(
    initialMockArticles.filter((a) => a.isSaved)
  );

  const handleToggleSave = (articleId: string) => {
    // Unsaving removes from the saved list
    setArticles((prev) => prev.filter((a) => a.id !== articleId));
  };

  const handleToggleRead = (articleId: string) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, isRead: !a.isRead } : a))
    );
  };

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
            <span>{articles.length} bookmarked {articles.length === 1 ? "article" : "articles"}</span>
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
