"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { SourceCard } from "@/features/sources/components/source-card";
import { SourceFormDialog } from "@/features/sources/components/source-form-dialog";
import { OpmlDialog } from "@/features/sources/components/opml-dialog";
import { SourceFormValues } from "@/lib/validation/schemas";
import { sourcesApi, quotaApi, opmlApi, QuotaUsage } from "@/lib/api/client";
import { RssSource } from "@/types/models";
import {
  Globe,
  Plus,
  Download,
  RotateCw,
  Search,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SourcesPage() {
  const [sources, setSources] = React.useState<RssSource[]>([]);
  const [quota, setQuota] = React.useState<QuotaUsage | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshingId, setRefreshingId] = React.useState<string | null>(null);
  const [isRefreshingAll, setIsRefreshingAll] = React.useState(false);
  const [refreshAllFeedback, setRefreshAllFeedback] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "healthy" | "error" | "disabled">("all");

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

  const handleRefreshAll = async () => {
    setIsRefreshingAll(true);
    setRefreshAllFeedback(null);
    try {
      const res = await sourcesApi.refreshAll();
      setRefreshAllFeedback(res.data.message);
      setTimeout(() => setRefreshAllFeedback(null), 4000);
      setReloadToken((prev) => prev + 1);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to refresh feeds");
    } finally {
      setIsRefreshingAll(false);
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

  const filteredSources = React.useMemo(() => {
    return sources.filter((s) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesFeed = s.feedUrl.toLowerCase().includes(q);
        const matchesDesc = s.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesFeed && !matchesDesc) return false;
      }

      if (statusFilter !== "all") {
        if (statusFilter === "healthy" && s.status !== "healthy") return false;
        if (statusFilter === "error" && s.status !== "error") return false;
        if (statusFilter === "disabled" && s.status !== "disabled") return false;
      }

      return true;
    });
  }, [sources, searchQuery, statusFilter]);

  const activeCount = sources.filter((s) => s.enabled && s.status !== "error").length;
  const errorCount = sources.filter((s) => s.status === "error").length;

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
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isRefreshingAll || sources.length === 0}
            className="h-8 gap-1.5 text-xs shadow-2xs cursor-pointer"
            title="Trigger refresh across all active sources"
          >
            <RotateCw className={`size-3.5 ${isRefreshingAll ? "animate-spin" : ""}`} />
            <span>{isRefreshingAll ? "Refreshing All..." : "Refresh All Feeds"}</span>
          </Button>

          <a
            href={opmlApi.getExportUrl()}
            download="rssfusion-subscriptions.opml"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "h-8 gap-1.5 text-xs shadow-2xs",
            })}
          >
            <Download className="size-3.5" />
            <span>Export OPML</span>
          </a>

          <OpmlDialog onImportSuccess={handleRetry} />

          <SourceFormDialog
            currentSourceCount={sources.length}
            maxQuota={maxQuota}
            onAddSource={handleAddSource}
          />
        </div>
      </PageHeader>

      {/* Refresh feedback toast */}
      {refreshAllFeedback && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in-50">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{refreshAllFeedback}</span>
        </div>
      )}

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
        <div className="space-y-4">
          {/* Stats Bar & Filter Toolbar */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center rounded-xl border border-border/80 bg-card/80 p-3 shadow-2xs backdrop-blur-xs">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search publication name or URL..."
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "healthy" | "error" | "disabled")}
                className="h-8.5 rounded-lg border border-border/80 bg-background/80 px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer shadow-2xs"
              >
                <option value="all">All Status</option>
                <option value="healthy">Healthy Only</option>
                <option value="error">Failing / Error</option>
                <option value="disabled">Disabled</option>
              </select>

              {(searchQuery || statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
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

          {/* Quick status counters */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <div className="flex items-center gap-3">
              <span>Total: <strong className="text-foreground">{sources.length}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3" />
                {activeCount} active
              </span>
              {errorCount > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="size-3" />
                    {errorCount} need attention
                  </span>
                </>
              )}
            </div>

            <span>
              Showing {filteredSources.length} of {sources.length}
            </span>
          </div>

          {/* Source Cards */}
          {filteredSources.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground rounded-xl border border-dashed border-border/80">
              No sources match your filter query.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSources.map((source) => (
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
      )}
    </div>
  );
}
