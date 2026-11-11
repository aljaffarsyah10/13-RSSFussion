"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { FeedFetchLog, RssSource } from "@/types/models";
import { sourcesApi } from "@/lib/api/client";
import { Activity, Clock, AlertTriangle, CheckCircle2, RotateCcw, Loader2 } from "lucide-react";

interface FeedHealthDialogProps {
  source: RssSource;
  children?: React.ReactElement;
  onRefresh?: (id: string) => void;
  isRefreshing?: boolean;
}

export function FeedHealthDialog({
  source,
  children,
  onRefresh,
  isRefreshing,
}: FeedHealthDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [logs, setLogs] = React.useState<FeedFetchLog[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;

    sourcesApi
      .get(source.id)
      .then((res) => {
        if (!cancelled && res?.fetchLogs) {
          setLogs(res.fetchLogs);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, source.id]);

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (val) {
      setLoading(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          children || (
            <Button variant="ghost" size="icon-xs" className="size-7 text-muted-foreground hover:text-foreground">
              <Activity className="size-3.5" />
              <span className="sr-only">Feed Health</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-base font-semibold truncate max-w-sm">
              {source.name} — Health & Diagnostics
            </DialogTitle>
            <StatusBadge status={source.status} />
          </div>
          <DialogDescription className="text-xs truncate font-mono">
            {source.feedUrl}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Health Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="rounded-lg border border-border bg-muted/20 p-2.5">
              <span className="text-[11px] text-muted-foreground">Fetch Interval</span>
              <p className="mt-1 font-semibold text-foreground">{source.fetchIntervalMinutes}m</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-2.5">
              <span className="text-[11px] text-muted-foreground">Failures</span>
              <p className="mt-1 font-semibold text-foreground">
                {source.consecutiveFailures > 0 ? (
                  <span className="text-red-600 dark:text-red-400 font-bold">
                    {source.consecutiveFailures} in a row
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400">0 healthy</span>
                )}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-2.5">
              <span className="text-[11px] text-muted-foreground">Last Success</span>
              <p className="mt-1 font-medium text-foreground truncate">
                {source.lastSuccessAt ? new Date(source.lastSuccessAt).toLocaleTimeString() : "Never"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-2.5">
              <span className="text-[11px] text-muted-foreground">Next Scheduled</span>
              <p className="mt-1 font-medium text-foreground truncate">
                {source.nextFetchAt ? new Date(source.nextFetchAt).toLocaleTimeString() : "Standby"}
              </p>
            </div>
          </div>

          {/* Last Error banner if present */}
          {source.lastError && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Last Ingestion Failure: </span>
                <span>{source.lastError}</span>
              </div>
            </div>
          )}

          {/* Fetch History Logs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span>Recent Fetch Ingestion Logs</span>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRefresh(source.id)}
                  disabled={isRefreshing || !source.enabled}
                  className="h-7 text-xs gap-1"
                >
                  <RotateCcw className={`size-3 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span>Request Re-fetch</span>
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-8 text-xs text-muted-foreground gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>Loading diagnostics...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="rounded-md border border-border p-6 text-center text-xs text-muted-foreground">
                <Clock className="size-5 mx-auto mb-1 text-muted-foreground/60" />
                <p>No fetch logs recorded yet for this feed.</p>
                <p className="text-[11px] mt-0.5">Logs appear as the background worker executes scheduled polls.</p>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-muted/10 divide-y divide-border/60 text-xs">
                {logs.map((log) => (
                  <div key={log.id} className="p-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {log.status === "success" || log.status === "not_modified" ? (
                        <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="size-3.5 text-red-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="font-medium text-foreground">
                          {log.status === "success"
                            ? "Ingestion Success"
                            : log.status === "not_modified"
                            ? "Not Modified (304)"
                            : "Fetch Error"}
                        </span>
                        {log.error_message && (
                          <p className="text-[11px] text-destructive truncate">{log.error_message}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 text-[11px] text-muted-foreground">
                      <span>
                        {log.articles_inserted ?? 0} new / {log.articles_found ?? 0} found
                      </span>
                      {log.duration_ms ? <span> • {log.duration_ms}ms</span> : null}
                      <p>{new Date(log.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <DialogClose
              render={
                <Button variant="outline" size="sm">
                  Close
                </Button>
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
