"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Dashboard Boundary Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive mb-4">
        <AlertCircle className="size-6" />
      </div>
      <h2 className="text-lg font-bold text-foreground">Dashboard Module Error</h2>
      <p className="mt-1 max-w-md text-xs text-muted-foreground leading-relaxed">
        We encountered an error loading this dashboard view. Your session and other tabs remain active.
      </p>
      {error.digest && (
        <span className="mt-2 text-[10px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
          Event ID: {error.digest}
        </span>
      )}
      <div className="mt-5 flex items-center gap-3">
        <Button size="sm" onClick={() => reset()} className="text-xs gap-1.5 cursor-pointer">
          <RefreshCw className="size-3.5" />
          <span>Reload View</span>
        </Button>
      </div>
    </div>
  );
}
