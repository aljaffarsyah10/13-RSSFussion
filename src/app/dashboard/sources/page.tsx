"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SourceCard } from "@/features/sources/components/source-card";
import { SourceFormDialog } from "@/features/sources/components/source-form-dialog";
import { initialMockSources } from "@/features/sources/mocks/sources.mock";
import { SourceFormValues } from "@/lib/validation/schemas";
import { RssSource } from "@/types/models";
import { Globe, Plus } from "lucide-react";

export default function SourcesPage() {
  const [sources, setSources] = React.useState<RssSource[]>(initialMockSources);
  const [refreshingId, setRefreshingId] = React.useState<string | null>(null);

  const handleToggleEnabled = (id: string) => {
    setSources((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              enabled: !s.enabled,
              status: !s.enabled ? "healthy" : "disabled",
            }
          : s
      )
    );
  };

  const handleRefresh = (id: string) => {
    setRefreshingId(id);
    setTimeout(() => {
      setSources((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status: "healthy",
                lastFetchedAt: "Just now",
                lastSuccessAt: "Just now",
                nextFetchAt: `in ${s.fetchIntervalMinutes} minutes`,
                consecutiveFailures: 0,
                lastError: undefined,
              }
            : s
        )
      );
      setRefreshingId(null);
    }, 800);
  };

  const handleDelete = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddSource = (values: SourceFormValues) => {
    const newSource: RssSource = {
      id: `src-${Date.now()}`,
      userId: "usr-demo",
      name: values.name,
      feedUrl: values.feedUrl,
      siteUrl: values.siteUrl || "",
      description: values.description,
      enabled: true,
      status: "healthy",
      lastFetchedAt: "Just now",
      lastSuccessAt: "Just now",
      nextFetchAt: `in ${values.fetchIntervalMinutes} minutes`,
      fetchIntervalMinutes: values.fetchIntervalMinutes,
      consecutiveFailures: 0,
      createdAt: new Date().toISOString(),
    };
    setSources((prev) => [newSource, ...prev]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="RSS Sources"
        description="Connect and manage news websites, tech blogs, and publication feeds."
      >
        <SourceFormDialog
          currentSourceCount={sources.length}
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
            onAddSource={handleAddSource}
          >
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
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
