"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ArticleCard } from "@/features/articles/components/article-card";
import { SourceFormDialog } from "@/features/sources/components/source-form-dialog";
import { SourceFormValues } from "@/lib/validation/schemas";
import { dashboardApi, articlesApi, sourcesApi, quotaApi, QuotaUsage } from "@/lib/api/client";
import { Article, DashboardStats } from "@/types/models";
import { Globe, Newspaper, FolderTree, Bookmark, Rss, ArrowRight } from "lucide-react";

export default function DashboardOverviewPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [recentArticles, setRecentArticles] = React.useState<Article[]>([]);
  const [quota, setQuota] = React.useState<QuotaUsage | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [fetchedStats, articlesRes, fetchedQuota] = await Promise.all([
          dashboardApi.getStats(),
          articlesApi.list({ limit: 5 }).catch(() => ({ data: [] })),
          quotaApi.getQuota().catch(() => null),
        ]);

        if (!cancelled) {
          setStats(fetchedStats);
          const items = articlesRes?.data || (Array.isArray(articlesRes) ? (articlesRes as unknown as Article[]) : []);
          setRecentArticles(items);
          if (fetchedQuota) setQuota(fetchedQuota);
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load dashboard statistics";
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
    const target = recentArticles.find((a) => a.id === articleId);
    if (!target) return;

    const newSaved = !target.isSaved;
    setRecentArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, isSaved: newSaved } : a))
    );

    try {
      if (newSaved) {
        await articlesApi.save(articleId);
      } else {
        await articlesApi.unsave(articleId);
      }
      dashboardApi.getStats().then(setStats).catch(() => {});
    } catch {
      setRecentArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, isSaved: target.isSaved } : a))
      );
    }
  };

  const handleToggleRead = async (articleId: string) => {
    const target = recentArticles.find((a) => a.id === articleId);
    if (!target) return;

    const newRead = !target.isRead;
    setRecentArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, isRead: newRead } : a))
    );

    try {
      await articlesApi.markRead(articleId);
    } catch {
      setRecentArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, isRead: target.isRead } : a))
      );
    }
  };

  const handleAddSource = async (values: SourceFormValues) => {
    await sourcesApi.create(values);
    setIsLoading(true);
    setReloadToken((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Intelligence Overview"
          description="Monitor feed aggregation activity, detected topics, and high-priority articles."
        />
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Intelligence Overview"
          description="Monitor feed aggregation activity, detected topics, and high-priority articles."
        />
        <ErrorState
          title="Unable to load dashboard data"
          description={error}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  const currentSourceCount = stats?.totalSources ?? 0;
  const maxQuota = quota?.limits?.maxSources ?? 5;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Intelligence Overview"
        description="Monitor feed aggregation activity, detected topics, and high-priority articles."
      >
        <SourceFormDialog
          currentSourceCount={currentSourceCount}
          maxQuota={maxQuota}
          onAddSource={handleAddSource}
        />
      </PageHeader>

      {/* 4 Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Connected Sources"
          value={stats?.totalSources ?? 0}
          description={`${stats?.activeSources ?? 0} active polling`}
          icon={Globe}
        />
        <StatCard
          title="Articles Today"
          value={stats?.totalArticlesToday ?? 0}
          description="Ingested in last 24h"
          icon={Newspaper}
        />
        <StatCard
          title="Monitored Topics"
          value={stats?.totalTopics ?? 0}
          description="Active tracking clusters"
          icon={FolderTree}
        />
        <StatCard
          title="Saved Articles"
          value={stats?.totalSavedArticles ?? 0}
          description="Bookmarked for review"
          icon={Bookmark}
        />
      </div>

      {/* Main split preview */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Recent Monitored Highlights
            </h2>
            <Link
              href="/dashboard/articles"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 underline underline-offset-4"
            >
              <span>View all feed</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {recentArticles.length === 0 ? (
            <EmptyState
              icon={Rss}
              title="No articles collected yet"
              description="Add your first RSS or Atom feed in Sources to trigger automated background fetching."
              actionLabel="Connect RSS Source"
              actionHref="/dashboard/sources"
            />
          ) : (
            <div className="space-y-3">
              {recentArticles.slice(0, 3).map((article) => (
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

        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-base font-semibold text-foreground">
            Feed Health Summary
          </h2>
          <div className="rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-border/50">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                Healthy Feeds
              </span>
              <span className="font-semibold text-foreground">{stats?.activeSources ?? 0}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-border/50">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-muted-foreground" />
                Total Configured
              </span>
              <span className="font-semibold text-foreground">{stats?.totalSources ?? 0}</span>
            </div>
            <div className="pt-2 text-[11px] leading-relaxed">
              Feeds are queried on scheduled intervals by the background ingestion worker.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
