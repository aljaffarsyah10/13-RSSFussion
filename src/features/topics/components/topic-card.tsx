"use client";

import * as React from "react";
import { Topic } from "@/types/models";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FolderTree, Trash2, Tag, Newspaper } from "lucide-react";

interface TopicCardProps {
  topic: Topic;
  assignedKeywords?: string[];
  onDelete: (id: string) => void;
}

export function TopicCard({
  topic,
  assignedKeywords = [],
  onDelete,
}: TopicCardProps) {
  return (
    <Card className="border border-border bg-card transition-all hover:border-foreground/20">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
              <FolderTree className="size-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-foreground">
                {topic.name}
              </h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Tag className="size-3" />
                  {topic.keywordsCount ?? assignedKeywords.length} keywords
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Newspaper className="size-3" />
                  {topic.articlesCount ?? 0} articles
                </span>
              </div>
            </div>
          </div>

          <ConfirmDialog
            title="Delete Topic?"
            description={`Are you sure you want to delete the topic "${topic.name}"? Monitored keywords attached to this topic will be detached.`}
            confirmLabel="Delete Topic"
            variant="destructive"
            onConfirm={() => onDelete(topic.id)}
            trigger={
              <Button
                variant="ghost"
                size="icon-xs"
                title="Delete topic"
                className="size-7 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                <span className="sr-only">Delete</span>
              </Button>
            }
          />
        </div>

        {topic.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {topic.description}
          </p>
        )}

        {assignedKeywords.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {assignedKeywords.map((kw) => (
              <Badge
                key={kw}
                variant="secondary"
                className="text-[10px] py-0 px-2 font-normal"
              >
                #{kw}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
