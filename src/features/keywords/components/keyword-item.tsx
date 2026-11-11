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
        "border border-border/80 bg-card/90 transition-all duration-200 hover:border-primary/40 hover:shadow-xs",
        !keyword.enabled && "opacity-60 bg-muted/20 border-border/40"
      )}
    >
      <CardContent className="flex items-center justify-between p-3.5 sm:p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-secondary/80 text-foreground">
            <Tag className="size-3.5 text-muted-foreground" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground tracking-tight truncate">
                {keyword.keyword}
              </span>
              {!keyword.enabled && (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-muted-foreground border-border/70">
                  Disabled
                </Badge>
              )}
            </div>
            {keyword.topicName && (
              <p className="text-[11px] text-muted-foreground truncate">
                in <span className="font-medium text-foreground/80">{keyword.topicName}</span>
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
              "size-7.5 hover:bg-muted/70",
              keyword.enabled
                ? "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                : "text-muted-foreground hover:text-foreground"
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
                className="size-7.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
