"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { opmlApi, OpmlImportResult } from "@/lib/api/client";
import { parseOpml, OpmlFeedItem } from "@/lib/rss/opml-parser";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface OpmlDialogProps {
  onImportSuccess: () => void;
  children?: React.ReactElement;
}

export function OpmlDialog({ onImportSuccess, children }: OpmlDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [previews, setPreviews] = React.useState<OpmlFeedItem[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<OpmlImportResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResult(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    try {
      const text = await selected.text();
      const parsed = parseOpml(text);
      if (parsed.feeds.length === 0) {
        setError("No valid RSS/Atom feed subscriptions found in this OPML file.");
      } else {
        setPreviews(parsed.feeds);
      }
    } catch {
      setError("Unable to parse file. Please verify it is a valid OPML XML document.");
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await opmlApi.importFile(file);
      setResult(res);
      onImportSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Import failed";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviews([]);
    setError(null);
    setResult(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) handleReset();
      }}
    >
      <DialogTrigger
        render={
          children || (
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <Upload className="size-3.5" />
              <span>Import OPML</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import OPML Subscriptions</DialogTitle>
          <DialogDescription>
            Import multiple RSS and Atom feeds at once from Feedly, Inoreader, or another RSS reader.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="size-4" />
                <span>Import Complete</span>
              </div>
              <p className="text-muted-foreground">
                Successfully imported <strong className="text-foreground">{result.importedCount}</strong> new sources.
                {result.skippedCount > 0 && ` (${result.skippedCount} skipped as existing or quota reached)`}
              </p>
              {result.errors.length > 0 && (
                <div className="mt-2 pt-2 border-t border-emerald-500/20 text-[11px] text-amber-700 dark:text-amber-400 space-y-1">
                  {result.errors.slice(0, 3).map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                  {result.errors.length > 3 && (
                    <p>• ...and {result.errors.length - 3} more notices.</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* File Upload Zone */}
              <div className="rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-foreground/30 transition-colors">
                <input
                  type="file"
                  id="opmlFileInput"
                  accept=".opml,.xml"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="opmlFileInput"
                  className="flex flex-col items-center justify-center cursor-pointer space-y-2"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-foreground">
                    <FileText className="size-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-foreground">
                      {file ? file.name : "Click to select OPML file"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Standard .opml or .xml export file (up to 2MB)
                    </p>
                  </div>
                </label>
              </div>

              {/* Feed Preview */}
              {previews.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-foreground">
                    <span>Feeds detected ({previews.length})</span>
                    <span className="text-[11px] text-muted-foreground">Previewing top 5</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto rounded-md border border-border bg-muted/20 p-2 divide-y divide-border/40 text-xs">
                    {previews.slice(0, 5).map((feed, idx) => (
                      <div key={idx} className="py-1.5 first:pt-0 last:pb-0">
                        <p className="font-medium truncate text-foreground">{feed.title}</p>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">
                          {feed.xmlUrl}
                        </p>
                      </div>
                    ))}
                    {previews.length > 5 && (
                      <p className="pt-1.5 text-center text-[11px] text-muted-foreground font-medium">
                        + {previews.length - 5} additional feeds will be imported
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          <DialogFooter className="mt-4 pt-2">
            <DialogClose
              render={
                <Button type="button" variant="outline" size="sm" disabled={isSubmitting}>
                  {result ? "Close" : "Cancel"}
                </Button>
              }
            />
            {!result && (
              <Button
                type="button"
                size="sm"
                onClick={handleImport}
                disabled={!file || previews.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    Importing...
                  </>
                ) : (
                  `Import ${previews.length > 0 ? `(${previews.length})` : ""}`
                )}
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
