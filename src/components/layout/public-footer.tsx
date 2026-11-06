import Link from "next/link";
import { Rss } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="w-full border-t border-border bg-card/50 py-8 text-sm text-muted-foreground">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex size-5 items-center justify-center rounded bg-foreground text-background">
            <Rss className="size-3" />
          </div>
          <span className="font-semibold text-foreground">RSSFusion</span>
          <span className="text-xs">— Information Intelligence Platform</span>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
        </div>

        <p className="text-xs">
          © 2026 RSSFusion. Built for focus.
        </p>
      </div>
    </footer>
  );
}
