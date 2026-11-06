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
import { Plus } from "lucide-react";

interface TopicFormDialogProps {
  onAddTopic: (values: TopicFormValues) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = topicFormSchema.safeParse({ name, description });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    onAddTopic(result.data);
    setOpen(false);
    setName("");
    setDescription("");
    setErrors({});
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
            />
            {errors.description && (
              <p className="text-[11px] text-destructive">{errors.description}</p>
            )}
          </div>

          <DialogFooter className="mt-4 pt-2">
            <DialogClose
              render={
                <Button type="button" variant="outline" size="sm">
                  Cancel
                </Button>
              }
            />
            <Button type="submit" size="sm">
              Save Topic
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
