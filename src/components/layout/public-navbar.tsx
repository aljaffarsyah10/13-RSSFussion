import Link from "next/link";
import { Rss } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
            <Rss className="size-4" />
          </div>
          <span className="font-bold tracking-tight text-foreground text-base">
            RSSFusion
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
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
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            Open App
          </Link>
        </div>
      </div>
    </header>
  );
}
