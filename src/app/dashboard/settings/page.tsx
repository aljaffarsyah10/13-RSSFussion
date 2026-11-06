"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { quotaApi, authApi, QuotaUsage } from "@/lib/api/client";
import { LogOut, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [quota, setQuota] = React.useState<QuotaUsage | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  React.useEffect(() => {
    quotaApi
      .getQuota()
      .then((res) => setQuota(res))
      .catch((err) => console.error("Could not fetch quota", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <PageHeader
          title="Settings"
          description="Manage your account profile, plan quotas, and ingestion preferences."
        />
        <LoadingSkeleton count={2} />
      </div>
    );
  }

  const planName = quota?.plan
    ? quota.plan.charAt(0).toUpperCase() + quota.plan.slice(1) + " Plan"
    : "Free Plan";

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings"
        description="Manage your account profile, plan quotas, and ingestion preferences."
      />

      {/* Plan & Quota Card */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Subscription & Quota</CardTitle>
              <CardDescription className="text-xs">
                Resource allocations enforced for your active plan.
              </CardDescription>
            </div>
            <Badge variant="secondary">{planName}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-md border border-border p-3">
              <span className="text-muted-foreground">Sources Quota</span>
              <p className="mt-1 font-bold text-base text-foreground">
                {quota?.usage.sources ?? 0} / {quota?.limits.maxSources ?? 5}
              </p>
            </div>
            <div className="rounded-md border border-border p-3">
              <span className="text-muted-foreground">Keywords Quota</span>
              <p className="mt-1 font-bold text-base text-foreground">
                {quota?.usage.keywords ?? 0} / {quota?.limits.maxKeywords ?? 3}
              </p>
            </div>
            <div className="rounded-md border border-border p-3">
              <span className="text-muted-foreground">Topics Quota</span>
              <p className="mt-1 font-bold text-base text-foreground">
                {quota?.usage.topics ?? 0} / {quota?.limits.maxTopics ?? 3}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Session Card */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Account Session</CardTitle>
          <CardDescription className="text-xs">
            Manage your authenticated session and workspace access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground">
            Sign out of your active session on this device. You will need to sign in again to access your feeds.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            {isLoggingOut ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <LogOut className="size-3.5" />
            )}
            <span>Sign Out</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
