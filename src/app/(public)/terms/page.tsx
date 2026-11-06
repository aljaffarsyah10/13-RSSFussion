import { PageHeader } from "@/components/shared/page-header";

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Terms of Service"
        description="Last updated: November 2026"
      />
      <div className="prose prose-sm dark:prose-invert space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p className="mt-1">
            By accessing or using RSSFusion, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">2. Feed Aggregation & Fair Use</h2>
          <p className="mt-1">
            RSSFusion parses publicly available RSS and Atom feeds for your personal or organizational intelligence. Users are responsible for ensuring that feeds added comply with copyright, robots.txt, and source policies.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">3. Quota & Service Boundaries</h2>
          <p className="mt-1">
            Feed polling rates and resource quotas are allocated according to your active subscription plan. Abusive ingestion patterns or circumvention of rate limits will result in suspension.
          </p>
        </section>
      </div>
    </div>
  );
}
