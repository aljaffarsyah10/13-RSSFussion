import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Rss,
  Zap,
  Tag,
  ArrowRight,
  BookmarkCheck,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-5xl px-4 pt-16 pb-20 text-center sm:pt-24 sm:pb-28">
        <Badge
          variant="secondary"
          className="mb-4 gap-1.5 px-3 py-1 text-xs font-medium"
        >
          <Zap className="size-3 text-amber-500" />
          <span>RSSFusion MVP v1.0</span>
        </Badge>

        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl sm:leading-[1.15]">
          Curate. Monitor. Focus.
          <br />
          <span className="text-muted-foreground font-semibold">
            Information Intelligence Without Noise.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Aggregate high-value feeds, blogs, and industry news into a unified workspace.
          Track critical keywords and organize articles into smart topics automatically.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className={buttonVariants({
              size: "lg",
              className: "h-11 px-6 text-sm gap-2",
            })}
          >
            Launch Dashboard
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/pricing"
            className={buttonVariants({
              size: "lg",
              variant: "outline",
              className: "h-11 px-6 text-sm",
            })}
          >
            View Plans
          </Link>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="w-full border-t border-border bg-card/30 py-16">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Engineered for High-Signal Reading
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Built on a dedicated background worker architecture for reliable, scheduled aggregation.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Rss className="size-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  Universal RSS & Atom
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Connect any valid publication or blog. Background workers handle polling, ETag caching, and feed health monitoring.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Tag className="size-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  Keyword & Topic Intelligence
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Define exact watch keywords. Articles are automatically scanned, matched, and classified into focused topic feeds.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookmarkCheck className="size-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  Saved Knowledge Base
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  One-click save articles for later reference. Uncluttered layout designed to eliminate tab fatigue.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
