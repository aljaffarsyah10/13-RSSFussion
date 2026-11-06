import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Globe, Plus } from "lucide-react";

export default function SourcesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="RSS Sources"
        description="Connect and manage news websites, tech blogs, and publication feeds."
      >
        <Button size="sm" className="h-8 gap-1.5 text-xs">
          <Plus className="size-3.5" />
          <span>Add RSS Source</span>
        </Button>
      </PageHeader>

      <EmptyState
        icon={Globe}
        title="No sources added yet"
        description="Connect RSS or Atom URLs to begin aggregating intelligence automatically."
        actionLabel="Add First Feed"
      />
    </div>
  );
}
