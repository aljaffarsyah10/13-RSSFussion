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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SourceFormValues, sourceFormSchema } from "@/lib/validation/schemas";
import { sourcesApi } from "@/lib/api/client";
import { Plus, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

interface SourceFormDialogProps {
  onAddSource: (values: SourceFormValues) => Promise<void> | void;
  currentSourceCount: number;
  maxQuota?: number;
  children?: React.ReactElement;
}

export function SourceFormDialog({
  onAddSource,
  currentSourceCount,
  maxQuota = 5,
  children,
}: SourceFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [feedUrl, setFeedUrl] = React.useState("");
  const [siteUrl, setSiteUrl] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [fetchIntervalMinutes, setFetchIntervalMinutes] = React.useState(60);

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [validatedFeed, setValidatedFeed] = React.useState<{
    title?: string;
    itemCount?: number;
  } | null>(null);

  const isQuotaReached = currentSourceCount >= maxQuota;

  const handleValidate = async () => {
    if (!feedUrl) {
      setErrors({ feedUrl: "Please enter a feed URL to validate" });
      return;
    }
    setIsValidating(true);
    setErrors({});
    setServerError(null);

    try {
      const res = await sourcesApi.validate(feedUrl);
      if (res.valid) {
        setValidatedFeed({
          title: res.title,
          itemCount: res.itemCount,
        });
        if (!name && res.title) setName(res.title);
        if (!siteUrl && res.siteUrl) setSiteUrl(res.siteUrl);
        if (!description && res.description) setDescription(res.description);
      } else {
        setErrors({ feedUrl: "Feed URL could not be validated" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Validation failed";
      setErrors({ feedUrl: msg });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const result = sourceFormSchema.safeParse({
      name,
      feedUrl,
      siteUrl,
      description,
      fetchIntervalMinutes,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const fieldName = issue.path[0] as string;
        fieldErrors[fieldName] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddSource(result.data);
      setOpen(false);
      resetForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save feed";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setFeedUrl("");
    setSiteUrl("");
    setDescription("");
    setFetchIntervalMinutes(60);
    setErrors({});
    setServerError(null);
    setValidatedFeed(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          children || (
            <Button size="sm" className="h-8 gap-1.5 text-xs">
              <Plus className="size-3.5" />
              <span>Add RSS Source</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add RSS / Atom Source</DialogTitle>
          <DialogDescription>
            Enter the feed URL of a blog, news site, or publication to begin automatic ingestion.
          </DialogDescription>
        </DialogHeader>

        {isQuotaReached ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="size-4 shrink-0" />
              <span>Plan Source Limit Reached</span>
            </div>
            <p>
              You are currently using {currentSourceCount} of {maxQuota} allowed sources. Upgrade your plan in Settings to connect additional sources.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {serverError && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-2 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="feedUrl" className="text-xs">
                Feed URL <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="feedUrl"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  placeholder="https://techcrunch.com/feed/"
                  className="h-8 text-xs flex-1"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleValidate}
                  disabled={isValidating || !feedUrl || isSubmitting}
                  className="h-8 text-xs shrink-0"
                >
                  {isValidating ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    "Validate"
                  )}
                </Button>
              </div>
              {errors.feedUrl && (
                <p className="text-[11px] text-destructive">{errors.feedUrl}</p>
              )}
            </div>

            {validatedFeed && (
              <div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-2 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="size-3.5 shrink-0" />
                <span>
                  Valid feed confirmed ({validatedFeed.itemCount ?? 0} items detected)
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">
                Publication Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="TechCrunch"
                className="h-8 text-xs"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-[11px] text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="siteUrl" className="text-xs">
                  Website URL
                </Label>
                <Input
                  id="siteUrl"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://techcrunch.com"
                  className="h-8 text-xs"
                  disabled={isSubmitting}
                />
                {errors.siteUrl && (
                  <p className="text-[11px] text-destructive">{errors.siteUrl}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="interval" className="text-xs">
                  Fetch Frequency
                </Label>
                <select
                  id="interval"
                  value={fetchIntervalMinutes}
                  onChange={(e) => setFetchIntervalMinutes(Number(e.target.value))}
                  disabled={isSubmitting}
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value={15}>Every 15 minutes</option>
                  <option value={30}>Every 30 minutes</option>
                  <option value={60}>Every 1 hour</option>
                  <option value={180}>Every 3 hours</option>
                  <option value={1440}>Once daily</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc" className="text-xs">
                Description (Optional)
              </Label>
              <Input
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief note about this feed"
                className="h-8 text-xs"
                disabled={isSubmitting}
              />
            </div>

            <DialogFooter className="mt-4 pt-2">
              <DialogClose
                render={
                  <Button type="button" variant="outline" size="sm" disabled={isSubmitting}>
                    Cancel
                  </Button>
                }
              />
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  "Save Source"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
