import Link from "next/link";
import { Rss } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="w-full border-t border-border/70 bg-card/40 py-10 text-xs text-muted-foreground backdrop-blur-xs">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-6 items-center justify-center rounded-md bg-foreground text-background">
            <Rss className="size-3.5" />
          </div>
          <span className="font-semibold text-foreground text-sm font-heading">RSSFusion</span>
          <span className="text-muted-foreground/60 hidden sm:inline">—</span>
          <span className="text-[11px] hidden sm:inline">Information Intelligence Platform</span>
        </div>

        <div className="flex items-center gap-6 font-medium">
          <Link href="/pricing" className="hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
        </div>

        <p className="text-[11px] text-muted-foreground/80">
          © 2026 RSSFusion. Crafted for high-signal reading.
        </p>
      </div>
    </footer>
  );
}
