import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusType = "healthy" | "pending" | "error" | "disabled";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = {
    healthy: {
      dot: "bg-emerald-500",
      badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      defaultLabel: "Healthy",
    },
    pending: {
      dot: "bg-blue-500 animate-pulse",
      badge: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
      defaultLabel: "Pending",
    },
    error: {
      dot: "bg-red-500",
      badge: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
      defaultLabel: "Error",
    },
    disabled: {
      dot: "bg-zinc-400",
      badge: "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
      defaultLabel: "Disabled",
    },
  }[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 px-2 py-0.5 text-xs font-normal border transition-colors",
        config.badge,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", config.dot)} />
      {label || config.defaultLabel}
    </Badge>
  );
}
