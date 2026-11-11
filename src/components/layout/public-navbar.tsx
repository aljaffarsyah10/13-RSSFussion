import Link from "next/link";
import { Rss } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="RSSFusion home">
          <div className="flex size-7.5 items-center justify-center rounded-lg bg-foreground text-background shadow-xs transition-transform duration-200 group-hover:scale-105">
            <Rss className="size-4" />
          </div>
          <span className="font-bold tracking-tight text-foreground text-base font-heading">
            RSSFusion
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-xs font-medium md:flex" aria-label="Main navigation">
          <Link
            href="/#features"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="/terms"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Privacy
          </Link>
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className={buttonVariants({ variant: "ghost", size: "sm", className: "text-xs" })}
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "default", size: "sm", className: "text-xs shadow-xs font-medium" })}
          >
            <span>Open App</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
