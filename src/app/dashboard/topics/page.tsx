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
import { FolderTree } from "lucide-react";

export default function TopicsPage() {
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [keywords, setKeywords] = React.useState<Keyword[]>([]);
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => {
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
  );
}
