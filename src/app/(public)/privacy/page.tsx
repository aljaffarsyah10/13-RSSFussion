import { PageHeader } from "@/components/shared/page-header";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Privacy Policy"
        description="Last updated: November 2026"
      />
      <div className="prose prose-sm dark:prose-invert space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-foreground">1. Data We Collect</h2>
          <p className="mt-1">
            We collect your account email address, authentication credentials managed via Supabase Auth, and the list of RSS URLs and watch keywords you configure.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">2. Usage of Information</h2>
          <p className="mt-1">
            Collected data is strictly utilized to fetch public articles, calculate keyword matches, and present your personalized intelligence feed. We do not sell your data or browsing habits.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">3. Security</h2>
          <p className="mt-1">
            Database records are protected via PostgreSQL Row Level Security (RLS). External feed requests are isolated through SSRF-guarded background workers.
          </p>
        </section>
      </div>
    </div>
  );
}
