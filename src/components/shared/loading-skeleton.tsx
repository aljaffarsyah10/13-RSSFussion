import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "cn";

interface LoadingSkeletonProps {
  type?: "article-list" | "card-grid" | "stat-row" | "table";
  count?: number;
  className?: string;
}

export function LoadingSkeleton({
  type = "article-list",
  count = 3,
  className,
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count });

  if (type === "stat-row") {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
        {items.map((_, i) => (
          <Card key={i} className="p-5 border border-border">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-8 rounded-md" />
            </div>
            <Skeleton className="mt-3 h-7 w-16" />
            <Skeleton className="mt-2 h-3 w-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (type === "card-grid") {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {items.map((_, i) => (
          <Card key={i} className="p-5 border border-border">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="mt-4 h-12 w-full" />
            <div className="mt-4 flex justify-between items-center">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-7 w-20" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className={cn("space-y-3 rounded-lg border border-border p-4", className)}>
        <Skeleton className="h-8 w-full" />
        {items.map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  // Default: article-list
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((_, i) => (
        <Card key={i} className="p-4 border border-border">
          <CardContent className="p-0">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-16" />
            </div>
            <Skeleton className="mt-2.5 h-5 w-4/5" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-1 h-4 w-3/4" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
