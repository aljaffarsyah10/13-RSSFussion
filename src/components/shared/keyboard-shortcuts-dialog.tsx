"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const shortcuts = [
    { key: "j / ↓", desc: "Select next article in feed" },
    { key: "k / ↑", desc: "Select previous article in feed" },
    { key: "o / Enter", desc: "Open reader view modal" },
    { key: "v", desc: "Open original article in new tab" },
    { key: "m", desc: "Toggle read / unread status" },
    { key: "s", desc: "Toggle bookmark / saved status" },
    { key: "x", desc: "Select / deselect for bulk actions" },
    { key: "/", desc: "Focus search bar" },
    { key: "?", desc: "Toggle keyboard shortcuts help" },
    { key: "Esc", desc: "Close modals or blur inputs" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Keyboard className="size-4" />
            </div>
            <DialogTitle className="text-base font-semibold">
              Keyboard Shortcuts
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Navigate and curate your intelligence stream without leaving your keyboard.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 divide-y divide-border/40 text-xs">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between py-2 transition-colors"
            >
              <span className="text-foreground/90">{sc.desc}</span>
              <kbd className="inline-flex h-5.5 min-w-5.5 items-center justify-center rounded border border-border/80 bg-muted/60 px-1.5 font-mono text-[11px] font-medium text-foreground shadow-2xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
