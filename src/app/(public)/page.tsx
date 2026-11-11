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
      {/* Background ambient lighting */}
      <div className="absolute top-14 inset-x-0 h-96 bg-gradient-to-b from-primary/5 via-primary/2 to-transparent pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="w-full max-w-5xl px-4 pt-18 pb-20 text-center sm:pt-28 sm:pb-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/60 px-3.5 py-1 text-xs font-medium text-foreground backdrop-blur-md shadow-2xs mb-6">
          <Zap className="size-3.5 text-amber-500 fill-amber-500" />
          <span>RSSFusion MVP v1.0 — Intelligence Aggregation</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl sm:leading-[1.12] font-heading">
          Curate. Monitor. Focus.
          <br />
          <span className="bg-gradient-to-r from-foreground via-foreground/80 to-muted-foreground bg-clip-text text-transparent">
            Information Intelligence Without Noise.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
          Aggregate high-value publications, industry beats, and research into a unified workspace.
          Monitor critical keywords in real time and categorize articles automatically.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/dashboard"
            className={buttonVariants({
              size: "lg",
              className: "h-11 px-6 text-sm gap-2 shadow-sm font-medium",
            })}
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/pricing"
            className={buttonVariants({
              size: "lg",
              variant: "outline",
              className: "h-11 px-6 text-sm font-medium border-border/80",
            })}
          >
            View Pricing Plans
          </Link>
        </div>

        {/* Feature stats micro bar */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8 border-t border-border/60 text-left">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Ingestion Interval</span>
            <p className="text-sm font-semibold text-foreground">Down to 15 mins</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Keyword Detection</span>
            <p className="text-sm font-semibold text-foreground">Word-boundary Regex</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Feed Formats</span>
            <p className="text-sm font-semibold text-foreground">RSS 2.0 & Atom 1.0</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Security</span>
            <p className="text-sm font-semibold text-foreground">Strict SSRF & ETag</p>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="w-full border-t border-border/70 bg-card/40 py-20 backdrop-blur-xs">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-14 text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="secondary" className="text-xs px-2.5 py-0.5">
              Core Capabilities
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl font-heading">
              Engineered for High-Signal Reading
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Built on a dedicated background ingestion worker and real-time indexing pipeline for complete reliability.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border border-border/80 bg-card/90 shadow-2xs hover:border-primary/40 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex size-10 items-center justify-center rounded-xl border border-border/60 bg-secondary/80 text-foreground">
                  <Rss className="size-5 text-primary" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground tracking-tight">
                  Universal RSS & Atom Ingestion
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Connect any valid news feed or blog. Workers handle concurrent polling, ETag caching, HTML sanitization, and diagnostics.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/80 bg-card/90 shadow-2xs hover:border-primary/40 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex size-10 items-center justify-center rounded-xl border border-border/60 bg-secondary/80 text-foreground">
                  <Tag className="size-5 text-primary" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground tracking-tight">
                  Keyword & Topic Intelligence
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Define watch keywords with exact boundaries. Incoming articles are instantly tagged, clustered into topics, and alerted via email.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/80 bg-card/90 shadow-2xs hover:border-primary/40 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex size-10 items-center justify-center rounded-xl border border-border/60 bg-secondary/80 text-foreground">
                  <BookmarkCheck className="size-5 text-primary" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground tracking-tight">
                  Archived Knowledge Base
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Bookmark high-priority stories with a single click. Review bookmarks and read status across all sources without tab clutter.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
