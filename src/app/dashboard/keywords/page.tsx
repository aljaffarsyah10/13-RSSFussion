"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { KeywordItem } from "@/features/keywords/components/keyword-item";
import { KeywordFormDialog } from "@/features/keywords/components/keyword-form-dialog";
import { KeywordFormValues } from "@/lib/validation/schemas";
import { keywordsApi, topicsApi } from "@/lib/api/client";
import { Keyword, Topic } from "@/types/models";
import { Tag } from "lucide-react";

export default function KeywordsPage() {
  const [keywords, setKeywords] = React.useState<Keyword[]>([]);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [fetchedKeywords, fetchedTopics] = await Promise.all([
          keywordsApi.list(),
          topicsApi.list().catch(() => []),
        ]);
        if (!cancelled) {
          setKeywords(fetchedKeywords || []);
          setTopics(fetchedTopics || []);
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load keywords";
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

  const handleToggleEnabled = async (id: string) => {
    const target = keywords.find((k) => k.id === id);
    if (!target) return;

    const newEnabled = !target.enabled;

    // Optimistic update
    setKeywords((prev) =>
      prev.map((k) => (k.id === id ? { ...k, enabled: newEnabled } : k))
    );

    try {
      await keywordsApi.update(id, { enabled: newEnabled });
    } catch {
      // Revert on error
      setKeywords((prev) =>
        prev.map((k) => (k.id === id ? { ...k, enabled: target.enabled } : k))
      );
    }
  };

  const handleDelete = async (id: string) => {
    const previous = keywords;
    setKeywords((prev) => prev.filter((k) => k.id !== id));

    try {
      await keywordsApi.delete(id);
    } catch (err: unknown) {
      setKeywords(previous);
      alert(err instanceof Error ? err.message : "Failed to delete keyword");
    }
  };

  const handleAddKeyword = async (values: KeywordFormValues) => {
    const created = await keywordsApi.create(values);
    const topic = topics.find((t) => t.id === values.topicId);
    setKeywords((prev) => [{ ...created, topicName: topic?.name }, ...prev]);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Keyword Monitoring"
          description="Configure exact watch terms to detect high-priority articles across all incoming feeds."
        />
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Keyword Monitoring"
          description="Configure exact watch terms to detect high-priority articles across all incoming feeds."
        />
        <ErrorState
          title="Unable to load keywords"
          description={error}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Keyword Monitoring"
        description="Configure exact watch terms to detect high-priority articles across all incoming feeds."
      >
        <KeywordFormDialog topics={topics} onAddKeyword={handleAddKeyword} />
      </PageHeader>

      {keywords.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No keywords being monitored"
          description="Add terms like 'PostgreSQL', 'Series A', or your company name for automated tracking."
        >
          <KeywordFormDialog topics={topics} onAddKeyword={handleAddKeyword} />
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {keywords.map((keyword) => (
            <KeywordItem
              key={keyword.id}
              keyword={keyword}
              onToggleEnabled={handleToggleEnabled}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
