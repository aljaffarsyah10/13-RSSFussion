import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Bookmark } from "lucide-react";

export default function SavedArticlesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved Articles"
        description="Your personal knowledge repository of bookmarked stories and research."
      />

      <EmptyState
        icon={Bookmark}
        title="No saved articles"
        description="Bookmark interesting articles from your feed to review or archive them here."
        actionLabel="Explore Feed"
        actionHref="/dashboard/articles"
      />
    </div>
  );
}
