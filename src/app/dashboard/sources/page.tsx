"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { SourceCard } from "@/features/sources/components/source-card";
import { SourceFormDialog } from "@/features/sources/components/source-form-dialog";
import { SourceFormValues } from "@/lib/validation/schemas";
import { sourcesApi, quotaApi, QuotaUsage } from "@/lib/api/client";
import { RssSource } from "@/types/models";
import { Globe, Plus } from "lucide-react";

export default function SourcesPage() {
  const [sources, setSources] = React.useState<RssSource[]>([]);
  const [quota, setQuota] = React.useState<QuotaUsage | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshingId, setRefreshingId] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [fetchedSources, fetchedQuota] = await Promise.all([
          sourcesApi.list(),
          quotaApi.getQuota().catch(() => null),
        ]);
        if (!cancelled) {
          setSources(fetchedSources || []);
          if (fetchedQuota) setQuota(fetchedQuota);
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load sources";
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
    const target = sources.find((s) => s.id === id);
    if (!target) return;

    const newEnabled = !target.enabled;

    // Optimistic update
    setSources((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              enabled: newEnabled,
              status: newEnabled ? "healthy" : "disabled",
            }
          : s
      )
    );

    try {
      await sourcesApi.update(id, { enabled: newEnabled });
    } catch {
      // Revert on error
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled: target.enabled, status: target.status } : s))
      );
    }
  };

  const handleRefresh = async (id: string) => {
    setRefreshingId(id);
    try {
      const updated = await sourcesApi.refresh(id);
      setSources((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch {
      setReloadToken((prev) => prev + 1);
    } finally {
      setRefreshingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const previous = sources;
    setSources((prev) => prev.filter((s) => s.id !== id));

    try {
      await sourcesApi.delete(id);
    } catch (err: unknown) {
      setSources(previous);
      alert(err instanceof Error ? err.message : "Failed to delete source");
    }
  };

  const handleAddSource = async (values: SourceFormValues) => {
    const created = await sourcesApi.create(values);
    setSources((prev) => [created, ...prev]);
    quotaApi.getQuota().then(setQuota).catch(() => {});
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="RSS Sources"
          description="Connect and manage news websites, tech blogs, and publication feeds."
        />
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="RSS Sources"
          description="Connect and manage news websites, tech blogs, and publication feeds."
        />
        <ErrorState
          title="Unable to load RSS sources"
          description={error}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  const maxQuota = quota?.limits?.maxSources ?? 5;

  return (
    <div className="space-y-6">
      <PageHeader
        title="RSS Sources"
        description="Connect and manage news websites, tech blogs, and publication feeds."
      >
        <SourceFormDialog
          currentSourceCount={sources.length}
          maxQuota={maxQuota}
          onAddSource={handleAddSource}
        />
      </PageHeader>

      {sources.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No sources connected"
          description="Connect RSS or Atom URLs to begin aggregating intelligence automatically."
        >
          <SourceFormDialog
            currentSourceCount={0}
            maxQuota={maxQuota}
            onAddSource={handleAddSource}
          >
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground cursor-pointer">
              <Plus className="size-3.5" />
              <span>Add Your First Feed</span>
            </button>
          </SourceFormDialog>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              onToggleEnabled={handleToggleEnabled}
              onRefresh={handleRefresh}
              onDelete={handleDelete}
              isRefreshing={refreshingId === source.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
