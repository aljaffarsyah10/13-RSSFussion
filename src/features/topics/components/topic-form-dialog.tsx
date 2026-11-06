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
import { TopicFormValues, topicFormSchema } from "@/lib/validation/schemas";
import { Plus, Loader2, AlertCircle } from "lucide-react";

interface TopicFormDialogProps {
  onAddTopic: (values: TopicFormValues) => Promise<void> | void;
  children?: React.ReactElement;
}

export function TopicFormDialog({
  onAddTopic,
  children,
}: TopicFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const result = topicFormSchema.safeParse({ name, description });

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
      await onAddTopic(result.data);
      setOpen(false);
      setName("");
      setDescription("");
      setErrors({});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save topic";
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
              <span>Create Topic</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Intelligence Topic</DialogTitle>
          <DialogDescription>
            Group keywords and filter incoming articles into thematic streams.
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
            <Label htmlFor="topicName" className="text-xs">
              Topic Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="topicName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Artificial Intelligence, MicroSaaS, Competitors"
              className="h-8 text-xs"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-[11px] text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="topicDesc" className="text-xs">
              Description (Optional)
            </Label>
            <Input
              id="topicDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of what this topic tracks"
              className="h-8 text-xs"
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-[11px] text-destructive">{errors.description}</p>
            )}
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
                "Save Topic"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
