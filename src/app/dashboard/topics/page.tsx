"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { TopicCard } from "@/features/topics/components/topic-card";
import { TopicFormDialog } from "@/features/topics/components/topic-form-dialog";
import { TopicFormValues } from "@/lib/validation/schemas";
import { topicsApi, keywordsApi } from "@/lib/api/client";
import { Topic, Keyword } from "@/types/models";
import { FolderTree, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function TopicsPage() {
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [keywords, setKeywords] = React.useState<Keyword[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [fetchedTopics, fetchedKeywords] = await Promise.all([
          topicsApi.list(),
          keywordsApi.list().catch(() => []),
        ]);
        if (!cancelled) {
          setTopics(fetchedTopics || []);
          setKeywords(fetchedKeywords || []);
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load topics";
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

  const handleDelete = async (id: string) => {
    const previous = topics;
    setTopics((prev) => prev.filter((t) => t.id !== id));

    try {
      await topicsApi.delete(id);
    } catch (err: unknown) {
      setTopics(previous);
      alert(err instanceof Error ? err.message : "Failed to delete topic");
    }
  };

  const handleAddTopic = async (values: TopicFormValues) => {
    const created = await topicsApi.create(values);
    setTopics((prev) => [created, ...prev]);
  };

  const filteredTopics = React.useMemo(() => {
    if (!searchQuery.trim()) return topics;
    const q = searchQuery.toLowerCase();
    return topics.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }, [topics, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Topic Management"
          description="Organize articles and monitored keywords into smart thematic clusters."
        />
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Topic Management"
          description="Organize articles and monitored keywords into smart thematic clusters."
        />
        <ErrorState
          title="Unable to load topics"
          description={error}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Topic Management"
        description="Organize articles and monitored keywords into smart thematic clusters."
      >
        <TopicFormDialog onAddTopic={handleAddTopic} />
      </PageHeader>

      {topics.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No topics defined"
          description="Create topics like 'Artificial Intelligence', 'Fintech', or 'Competitors' to organize articles."
        >
          <TopicFormDialog onAddTopic={handleAddTopic} />
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {/* Quick Search */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics..."
                className="h-8.5 pl-8 pr-7 text-xs bg-muted/30 border-border/70 focus-visible:bg-background transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              <span>{filteredTopics.length} of {topics.length} topics</span>
            </div>
          </div>

          {filteredTopics.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground rounded-xl border border-dashed border-border/80">
              No topics match your search query.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTopics.map((topic) => {
                const assignedKeywords = keywords
                  .filter((k) => k.topicId === topic.id)
                  .map((k) => k.keyword);

                return (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    assignedKeywords={assignedKeywords}
                    onDelete={handleDelete}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
