"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ArticleCard } from "@/features/articles/components/article-card";
import { SourceFormDialog } from "@/features/sources/components/source-form-dialog";
import { initialMockArticles } from "@/features/articles/mocks/articles.mock";
import { initialMockSources } from "@/features/sources/mocks/sources.mock";
import { initialMockTopics } from "@/features/topics/mocks/topics.mock";
import { Globe, Newspaper, FolderTree, Bookmark, Rss, ArrowRight } from "lucide-react";

export default function DashboardOverviewPage() {
  const [articles, setArticles] = React.useState(initialMockArticles);
  const [sources, setSources] = React.useState(initialMockSources);
  const [topics] = React.useState(initialMockTopics);

  const activeSourcesCount = sources.filter((s) => s.enabled && s.status === "healthy").length;
  const failingSourcesCount = sources.filter((s) => s.status === "error").length;
  const savedArticlesCount = articles.filter((a) => a.isSaved).length;

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

  const handleAddSource = (values: { name: string; feedUrl: string; siteUrl?: string; description?: string }) => {
    const newSource = {
      id: `src-${Date.now()}`,
      userId: "usr-demo",
      name: values.name,
      feedUrl: values.feedUrl,
      siteUrl: values.siteUrl || "",
      description: values.description,
      enabled: true,
      status: "healthy" as const,
      lastFetchedAt: "Just now",
      lastSuccessAt: "Just now",
      nextFetchAt: "in 60 minutes",
      fetchIntervalMinutes: 60,
      consecutiveFailures: 0,
      createdAt: new Date().toISOString(),
    };
    setSources((prev) => [newSource, ...prev]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Intelligence Overview"
        description="Monitor feed aggregation activity, detected topics, and high-priority articles."
      >
        <SourceFormDialog
          currentSourceCount={sources.length}
          onAddSource={handleAddSource}
        />
      </PageHeader>

      {/* 4 Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Connected Sources"
          value={sources.length}
          description={`${activeSourcesCount} active polling`}
          icon={Globe}
        />
        <StatCard
          title="Articles Today"
          value={articles.length}
          description="Ingested in last 24h"
          icon={Newspaper}
        />
        <StatCard
          title="Monitored Topics"
          value={topics.length}
          description="Active tracking clusters"
          icon={FolderTree}
        />
        <StatCard
          title="Saved Articles"
          value={savedArticlesCount}
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

          {articles.length === 0 ? (
            <EmptyState
              icon={Rss}
              title="No articles collected yet"
              description="Add your first RSS or Atom feed in Sources to trigger automated background fetching."
              actionLabel="Connect RSS Source"
              actionHref="/dashboard/sources"
            />
          ) : (
            <div className="space-y-3">
              {articles.slice(0, 3).map((article) => (
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
              <span className="font-semibold text-foreground">{activeSourcesCount}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-border/50">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-red-500" />
                Failing / Stale Feeds
              </span>
              <span className="font-semibold text-foreground">{failingSourcesCount}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-border/50">
              <span>Background Polling</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                Active (30s interval)
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 text-[11px]">
              <span>Plan Quota Utilization</span>
              <span className="font-medium text-foreground">
                {sources.length} / 5 Sources
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
