"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { KeywordItem } from "@/features/keywords/components/keyword-item";
import { KeywordFormDialog } from "@/features/keywords/components/keyword-form-dialog";
import { initialMockKeywords } from "@/features/keywords/mocks/keywords.mock";
import { initialMockTopics } from "@/features/topics/mocks/topics.mock";
import { KeywordFormValues } from "@/lib/validation/schemas";
import { Keyword } from "@/types/models";
import { Tag } from "lucide-react";

export default function KeywordsPage() {
  const [keywords, setKeywords] = React.useState<Keyword[]>(initialMockKeywords);
  const [topics] = React.useState(initialMockTopics);

  const handleToggleEnabled = (id: string) => {
    setKeywords((prev) =>
      prev.map((k) => (k.id === id ? { ...k, enabled: !k.enabled } : k))
    );
  };

  const handleDelete = (id: string) => {
    setKeywords((prev) => prev.filter((k) => k.id !== id));
  };

  const handleAddKeyword = (values: KeywordFormValues) => {
    const topic = topics.find((t) => t.id === values.topicId);
    const newKeyword: Keyword = {
      id: `kw-${Date.now()}`,
      userId: "usr-demo",
      keyword: values.keyword,
      topicId: values.topicId,
      topicName: topic?.name,
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    setKeywords((prev) => [newKeyword, ...prev]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Keyword Monitoring"
        description="Configure exact watch terms to detect high-priority articles across all incoming feeds."
      >
        <KeywordFormDialog topics={topics} onAddKeyword={handleAddKeyword} />
      </PageHeader>

      {keywords.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No keywords being monitored"
          description="Add terms like 'PostgreSQL', 'Series A', or your company name for automated tracking."
        >
          <KeywordFormDialog topics={topics} onAddKeyword={handleAddKeyword} />
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {keywords.map((keyword) => (
            <KeywordItem
              key={keyword.id}
              keyword={keyword}
              onToggleEnabled={handleToggleEnabled}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
