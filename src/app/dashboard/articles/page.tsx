import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Newspaper, Search, Filter } from "lucide-react";

export default function ArticlesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Articles Feed"
        description="Browse and filter aggregated stories from your followed publications."
      />

      {/* Filter toolbar placeholder */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border bg-card p-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search headline or snippet..."
            className="h-8 pl-8 text-xs bg-muted/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <Filter className="size-3" />
            <span>All Sources</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            All Topics
          </Button>
        </div>
      </div>

      <EmptyState
        icon={Newspaper}
        title="Your feed is empty"
        description="Once feeds are added in Sources, the background worker will ingest articles here."
        actionLabel="Go to Sources"
        actionHref="/dashboard/sources"
      />
    </div>
  );
}
