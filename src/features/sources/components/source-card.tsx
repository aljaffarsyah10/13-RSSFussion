"use client";

import * as React from "react";
import { RssSource } from "@/types/models";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Globe, RefreshCw, Trash2, Power, AlertTriangle, ExternalLink } from "lucide-react";
import { cn } from "cn";

interface SourceCardProps {
  source: RssSource;
  onToggleEnabled: (id: string) => void;
  onRefresh: (id: string) => void;
  onDelete: (id: string) => void;
  isRefreshing?: boolean;
}

export function SourceCard({
  source,
  onToggleEnabled,
  onRefresh,
  onDelete,
  isRefreshing,
}: SourceCardProps) {
  return (
    <Card
      className={cn(
        "border border-border bg-card transition-all hover:border-foreground/20",
        !source.enabled && "opacity-60 bg-muted/10"
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
              <Globe className="size-4" />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                  {source.name}
                </h3>
                <StatusBadge status={source.status} />
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono truncate">
                <span className="truncate max-w-[260px] sm:max-w-md">{source.feedUrl}</span>
                {source.siteUrl && (
                  <a
                    href={source.siteUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-muted-foreground hover:text-foreground shrink-0"
                    title="Visit site"
                  >
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>

              {source.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {source.description}
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
            <Button
              variant="outline"
              size="icon-xs"
              title="Manual refresh"
              disabled={isRefreshing || !source.enabled}
              onClick={() => onRefresh(source.id)}
              className="size-7 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
              <span className="sr-only">Refresh</span>
            </Button>

            <Button
              variant="outline"
              size="icon-xs"
              title={source.enabled ? "Disable feed" : "Enable feed"}
              onClick={() => onToggleEnabled(source.id)}
              className={cn(
                "size-7",
                source.enabled
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground"
              )}
            >
              <Power className="size-3.5" />
              <span className="sr-only">Toggle enabled</span>
            </Button>

            <ConfirmDialog
              title="Delete RSS Source?"
              description={`Are you sure you want to remove "${source.name}"? Articles collected from this feed will remain in your archive.`}
              confirmLabel="Delete Source"
              variant="destructive"
              onConfirm={() => onDelete(source.id)}
              trigger={
                <Button
                  variant="outline"
                  size="icon-xs"
                  title="Delete source"
                  className="size-7 text-muted-foreground hover:text-destructive hover:border-destructive/30"
                >
                  <Trash2 className="size-3.5" />
                  <span className="sr-only">Delete</span>
                </Button>
              }
            />
          </div>
        </div>

        {/* Schedule & Error Footer */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>Interval: every {source.fetchIntervalMinutes}m</span>
            <span>•</span>
            <span>Last fetched: {source.lastFetchedAt || "Never"}</span>
            <span>•</span>
            <span>Next: {source.nextFetchAt || "Standby"}</span>
          </div>

          {source.lastError && (
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
              <AlertTriangle className="size-3 shrink-0" />
              <span className="truncate max-w-[200px]">{source.lastError}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
