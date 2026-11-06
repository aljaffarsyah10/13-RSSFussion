import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Globe, Newspaper, FolderTree, Bookmark, Plus, Rss } from "lucide-react";

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Intelligence Overview"
        description="Monitor feed aggregation activity, detected topics, and high-priority articles."
      >
        <Link
          href="/dashboard/sources"
          className={buttonVariants({
            size: "sm",
            className: "h-8 gap-1.5 text-xs",
          })}
        >
          <Plus className="size-3.5" />
          <span>Add Source</span>
        </Link>
      </PageHeader>

      {/* 4 Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Connected Sources"
          value="0"
          description="0 active feeds polling"
          icon={Globe}
        />
        <StatCard
          title="Articles Today"
          value="0"
          description="Ingested in last 24h"
          icon={Newspaper}
        />
        <StatCard
          title="Monitored Topics"
          value="0"
          description="Active tracking clusters"
          icon={FolderTree}
        />
        <StatCard
          title="Saved Articles"
          value="0"
          description="Bookmarked for review"
          icon={Bookmark}
        />
      </div>

      {/* Main split preview */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Recent Ingested Articles
            </h2>
            <Link
              href="/dashboard/articles"
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              View all
            </Link>
          </div>

          <EmptyState
            icon={Rss}
            title="No articles collected yet"
            description="Add your first RSS or Atom feed in Sources to trigger automated background fetching."
            actionLabel="Connect RSS Source"
            actionHref="/dashboard/sources"
          />
        </div>

        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-base font-semibold text-foreground">
            Feed Health Summary
          </h2>
          <div className="rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-border/50">
              <span>Healthy Feeds</span>
              <span className="font-semibold text-foreground">0</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-border/50">
              <span>Failing / Stale Feeds</span>
              <span className="font-semibold text-foreground">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Next Global Polling Run</span>
              <span className="font-medium text-foreground">Worker Standby</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
