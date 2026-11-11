"use client";

import * as React from "react";
import { Keyword } from "@/types/models";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Tag, Trash2, Power } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeywordItemProps {
  keyword: Keyword;
  onToggleEnabled: (id: string) => void;
  onDelete: (id: string) => void;
}

export function KeywordItem({
  keyword,
  onToggleEnabled,
  onDelete,
}: KeywordItemProps) {
  return (
    <Card
      className={cn(
        "border border-border bg-card transition-all hover:border-foreground/20",
        !keyword.enabled && "opacity-60 bg-muted/20"
      )}
    >
      <CardContent className="flex items-center justify-between p-3.5 sm:p-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
            <Tag className="size-3.5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground truncate">
                {keyword.keyword}
              </span>
              {!keyword.enabled && (
                <Badge variant="outline" className="text-[10px] py-0 px-1 text-muted-foreground">
                  Disabled
                </Badge>
              )}
            </div>
            {keyword.topicName && (
              <p className="text-[11px] text-muted-foreground truncate">
                in {keyword.topicName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="icon-xs"
            title={keyword.enabled ? "Disable keyword" : "Enable keyword"}
            onClick={() => onToggleEnabled(keyword.id)}
            className={cn(
              "size-7",
              keyword.enabled
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground"
            )}
          >
            <Power className="size-3.5" />
            <span className="sr-only">Toggle enabled</span>
          </Button>

          <ConfirmDialog
            title="Delete Watch Keyword?"
            description={`Are you sure you want to delete "${keyword.keyword}"? Past matched articles will retain historical tag associations.`}
            confirmLabel="Delete Keyword"
            variant="destructive"
            onConfirm={() => onDelete(keyword.id)}
            trigger={
              <Button
                variant="ghost"
                size="icon-xs"
                title="Delete keyword"
                className="size-7 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                <span className="sr-only">Delete</span>
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
