import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { FolderTree, Plus } from "lucide-react";

export default function TopicsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Topic Management"
        description="Organize articles and monitored keywords into smart thematic clusters."
      >
        <Button size="sm" className="h-8 gap-1.5 text-xs">
          <Plus className="size-3.5" />
          <span>New Topic</span>
        </Button>
      </PageHeader>

      <EmptyState
        icon={FolderTree}
        title="No topics defined"
        description="Create topics like 'Artificial Intelligence', 'Fintech', or 'Competitors' to organize articles."
        actionLabel="Create First Topic"
      />
    </div>
  );
}
