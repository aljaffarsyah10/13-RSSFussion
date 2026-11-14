"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log fatal client error
    console.error("Global Application Error Captured:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 antialiased">
        <div className="max-w-md w-full rounded-2xl border border-destructive/20 bg-card p-6 shadow-xl text-center space-y-5">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-8 ring-destructive/5">
            <AlertTriangle className="size-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight">Something went wrong</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              An unexpected application error was encountered. Our monitoring system has recorded this event.
            </p>
            {error.digest && (
              <p className="text-[10px] font-mono bg-muted/60 text-muted-foreground px-2 py-1 rounded inline-block">
                Ref: {error.digest}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
            >
              <RefreshCw className="size-3.5" />
              <span>Try Again</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              <Home className="size-3.5" />
              <span>Back Home</span>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
