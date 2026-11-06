"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TopicCard } from "@/features/topics/components/topic-card";
import { TopicFormDialog } from "@/features/topics/components/topic-form-dialog";
import { initialMockTopics } from "@/features/topics/mocks/topics.mock";
import { initialMockKeywords } from "@/features/keywords/mocks/keywords.mock";
import { TopicFormValues } from "@/lib/validation/schemas";
import { Topic } from "@/types/models";
import { FolderTree } from "lucide-react";

export default function TopicsPage() {
  const [topics, setTopics] = React.useState<Topic[]>(initialMockTopics);
  const [keywords] = React.useState(initialMockKeywords);

  const handleDelete = (id: string) => {
    setTopics((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddTopic = (values: TopicFormValues) => {
    const newTopic: Topic = {
      id: `tpc-${Date.now()}`,
      userId: "usr-demo",
      name: values.name,
      description: values.description,
      keywordsCount: 0,
      articlesCount: 0,
      createdAt: new Date().toISOString(),
    };
    setTopics((prev) => [newTopic, ...prev]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Topic Management"
        description="Organize articles and monitored keywords into smart thematic clusters."
      >
        <TopicFormDialog onAddTopic={handleAddTopic} />
      </PageHeader>

      {topics.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No topics defined"
          description="Create topics like 'Artificial Intelligence', 'Fintech', or 'Competitors' to organize articles."
        >
          <TopicFormDialog onAddTopic={handleAddTopic} />
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => {
            const assignedKeywords = keywords
              .filter((k) => k.topicId === topic.id)
              .map((k) => k.keyword);

            return (
              <TopicCard
                key={topic.id}
                topic={topic}
                assignedKeywords={assignedKeywords}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
