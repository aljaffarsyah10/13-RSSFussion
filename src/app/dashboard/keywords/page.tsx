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
import { Tag, Search, X, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function KeywordsPage() {
  const [keywords, setKeywords] = React.useState<Keyword[]>([]);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTopicId, setSelectedTopicId] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "paused">("all");

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

  const filteredKeywords = React.useMemo(() => {
    return keywords.filter((k) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!k.keyword.toLowerCase().includes(q) && !k.topicName?.toLowerCase().includes(q)) {
          return false;
        }
      }

      if (selectedTopicId === "none") {
        if (k.topicId) return false;
      } else if (selectedTopicId) {
        if (k.topicId !== selectedTopicId) return false;
      }

      if (statusFilter === "active" && !k.enabled) return false;
      if (statusFilter === "paused" && k.enabled) return false;

      return true;
    });
  }, [keywords, searchQuery, selectedTopicId, statusFilter]);

  const activeCount = keywords.filter((k) => k.enabled).length;

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
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center rounded-xl border border-border/80 bg-card/80 p-3 shadow-2xs backdrop-blur-xs">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search monitored keywords..."
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

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="h-8.5 rounded-lg border border-border/80 bg-background/80 px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer shadow-2xs"
              >
                <option value="">All Topics</option>
                <option value="none">Uncategorized</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "paused")}
                className="h-8.5 rounded-lg border border-border/80 bg-background/80 px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer shadow-2xs"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="paused">Paused</option>
              </select>

              {(searchQuery || selectedTopicId || statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedTopicId("");
                    setStatusFilter("all");
                  }}
                  className="h-8.5 text-xs text-muted-foreground hover:text-foreground px-2 cursor-pointer"
                >
                  <X className="size-3.5 mr-1" />
                  <span>Reset</span>
                </Button>
              )}
            </div>
          </div>

          {/* Metrics Row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <div className="flex items-center gap-3">
              <span>Total: <strong className="text-foreground">{keywords.length}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3" />
                {activeCount} active
              </span>
            </div>
            <span>
              Showing {filteredKeywords.length} of {keywords.length}
            </span>
          </div>

          {/* Grid */}
          {filteredKeywords.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground rounded-xl border border-dashed border-border/80">
              No keywords match your filter criteria.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredKeywords.map((keyword) => (
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
      )}
    </div>
  );
}
