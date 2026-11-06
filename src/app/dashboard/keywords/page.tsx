import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Tag, Plus } from "lucide-react";

export default function KeywordsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Keyword Monitoring"
        description="Configure exact watch terms to detect high-priority articles across all incoming feeds."
      >
        <Button size="sm" className="h-8 gap-1.5 text-xs">
          <Plus className="size-3.5" />
          <span>Add Keyword</span>
        </Button>
      </PageHeader>

      <EmptyState
        icon={Tag}
        title="No keywords being monitored"
        description="Add terms like 'PostgreSQL', 'Series A', or your company name for automated tracking."
        actionLabel="Add Watch Keyword"
      />
    </div>
  );
}
