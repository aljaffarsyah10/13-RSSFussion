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
import { KeywordFormValues, keywordFormSchema } from "@/lib/validation/schemas";
import { Topic } from "@/types/models";
import { Plus, Loader2, AlertCircle } from "lucide-react";

interface KeywordFormDialogProps {
  topics: Topic[];
  onAddKeyword: (values: KeywordFormValues) => Promise<void> | void;
  children?: React.ReactElement;
}

export function KeywordFormDialog({
  topics,
  onAddKeyword,
  children,
}: KeywordFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [keyword, setKeyword] = React.useState("");
  const [topicId, setTopicId] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const result = keywordFormSchema.safeParse({ keyword, topicId: topicId || undefined });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddKeyword(result.data);
      setOpen(false);
      setKeyword("");
      setTopicId("");
      setErrors({});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save keyword";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          children || (
            <Button size="sm" className="h-8 gap-1.5 text-xs">
              <Plus className="size-3.5" />
              <span>Add Keyword</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Watch Keyword</DialogTitle>
          <DialogDescription>
            Incoming articles matching this exact phrase will be flagged and mapped into topics.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {serverError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-2 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="kw" className="text-xs">
              Keyword Phrase <span className="text-destructive">*</span>
            </Label>
            <Input
              id="kw"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. Supabase, Series A, Anthropic"
              className="h-8 text-xs"
              disabled={isSubmitting}
            />
            {errors.keyword && (
              <p className="text-[11px] text-destructive">{errors.keyword}</p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Case-insensitive, exact boundary matching.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kwTopic" className="text-xs">
              Assign to Topic (Optional)
            </Label>
            <select
              id="kwTopic"
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              disabled={isSubmitting}
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">No Topic (General Watch)</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
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
                "Save Keyword"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
