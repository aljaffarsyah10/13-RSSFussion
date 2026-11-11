import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  trend?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  badge,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border border-border/80 bg-card/80 transition-all duration-200 hover:border-primary/30 hover:shadow-xs",
        className
      )}
    >
      <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-primary/5 via-transparent to-transparent pointer-events-none rounded-tr-xl" />
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground/90">
            {title}
          </p>
          {Icon && (
            <div className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-secondary/80 text-foreground transition-transform duration-200 group-hover:scale-105">
              <Icon className="size-4 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-heading">
            {value}
          </span>
          {badge}
        </div>
        {(description || trend) && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            {trend && <span className="text-emerald-500 font-medium">{trend}</span>}
            {description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
