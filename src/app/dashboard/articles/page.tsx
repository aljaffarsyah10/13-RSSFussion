"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ArticleCard } from "@/features/articles/components/article-card";
import { ArticleFilters } from "@/features/articles/components/article-filters";
import { initialMockArticles } from "@/features/articles/mocks/articles.mock";
import { initialMockSources } from "@/features/sources/mocks/sources.mock";
import { initialMockTopics } from "@/features/topics/mocks/topics.mock";
import { Button } from "@/components/ui/button";
import { Newspaper, Loader2 } from "lucide-react";

export default function ArticlesPage() {
  const [articles, setArticles] = React.useState(initialMockArticles);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedSourceId, setSelectedSourceId] = React.useState("");
  const [selectedTopic, setSelectedTopic] = React.useState("");
  const [visibleCount, setVisibleCount] = React.useState(4);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // Filter pipeline
  const filteredArticles = React.useMemo(() => {
    return articles.filter((article) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = article.title.toLowerCase().includes(query);
        const matchesSnippet = article.description.toLowerCase().includes(query);
        const matchesKw = article.matchedKeywords?.some((kw) =>
          kw.toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesSnippet && !matchesKw) return false;
      }

      // 2. Source filter
      if (selectedSourceId && article.sourceId !== selectedSourceId) {
        return false;
      }

      // 3. Topic filter
      if (selectedTopic && !article.topics?.includes(selectedTopic)) {
        return false;
      }

      return true;
    });
  }, [articles, searchQuery, selectedSourceId, selectedTopic]);

  const displayedArticles = filteredArticles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredArticles.length;

  const handleToggleSave = (articleId: string) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, isSaved: !a.isSaved } : a))
    );
  };

  const handleToggleRead = (articleId: string) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, isRead: !a.isRead } : a))
    );
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 4);
      setIsLoadingMore(false);
    }, 400);
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
        onSearchChange={setSearchQuery}
        selectedSourceId={selectedSourceId}
        onSourceChange={setSelectedSourceId}
        selectedTopic={selectedTopic}
        onTopicChange={setSelectedTopic}
        availableSources={initialMockSources.map((s) => ({ id: s.id, name: s.name }))}
        availableTopics={initialMockTopics.map((t) => ({ id: t.id, name: t.name }))}
        totalCount={filteredArticles.length}
      />

      {/* Article List / Feed */}
      {filteredArticles.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No articles match your filters"
          description="Try broadening your search term or selecting a different source/topic filter."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery("");
            setSelectedSourceId("");
            setSelectedTopic("");
          }}
        />
      ) : (
        <div className="space-y-3">
          {displayedArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onToggleSave={handleToggleSave}
              onToggleRead={handleToggleRead}
            />
          ))}

          {hasMore && (
            <div className="pt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="h-9 px-6 text-xs gap-1.5"
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
