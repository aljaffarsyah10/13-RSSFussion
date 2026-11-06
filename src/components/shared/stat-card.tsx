import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "cn";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  badge,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden border border-border shadow-xs", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {Icon && (
            <div className="flex size-8 items-center justify-center rounded-md bg-secondary text-foreground">
              <Icon className="size-4" />
            </div>
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </span>
          {badge}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
