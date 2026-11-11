"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { quotaApi, authApi, notificationsApi, QuotaUsage } from "@/lib/api/client";
import { LogOut, Loader2, Bell, CheckCircle2, ShieldCheck, Mail, Sparkles } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [quota, setQuota] = React.useState<QuotaUsage | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // Email notifications state
  const [notifEnabled, setNotifEnabled] = React.useState(true);
  const [notifEmail, setNotifEmail] = React.useState("");
  const [isSavingNotifs, setIsSavingNotifs] = React.useState(false);
  const [notifSuccess, setNotifSuccess] = React.useState(false);
  const [notifHistory, setNotifHistory] = React.useState<
    Array<{ id: string; subject: string; recipientEmail: string; status: string; createdAt: string }>
  >([]);

  React.useEffect(() => {
    Promise.all([
      quotaApi.getQuota().catch(() => null),
      notificationsApi.getSettings().catch(() => null),
      notificationsApi.listHistory().catch(() => []),
    ])
      .then(([qRes, nSettings, nHistory]) => {
        if (qRes) setQuota(qRes);
        if (nSettings) {
          setNotifEnabled(nSettings.emailNotificationsEnabled);
          setNotifEmail(nSettings.notificationEmail);
        }
        if (nHistory) setNotifHistory(nHistory);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingNotifs(true);
    setNotifSuccess(false);

    try {
      await notificationsApi.updateSettings({
        emailNotificationsEnabled: notifEnabled,
        notificationEmail: notifEmail,
      });
      setNotifSuccess(true);
      setTimeout(() => setNotifSuccess(false), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update notification settings");
    } finally {
      setIsSavingNotifs(false);
    }
  };

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
      <Card className="border border-border/80 bg-card/90 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                Subscription & Quota
              </CardTitle>
              <CardDescription className="text-xs">
                Resource allocations enforced for your active plan.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-2.5 py-1 text-xs font-semibold">
                {planName}
              </Badge>
              <Link
                href="/pricing"
                className="text-xs text-primary font-medium hover:underline underline-offset-4 hidden sm:inline"
              >
                Upgrade
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-1">
              <span className="text-muted-foreground font-medium">Sources Quota</span>
              <p className="font-bold text-lg text-foreground font-heading">
                {quota?.usage.sources ?? 0} <span className="text-xs font-normal text-muted-foreground">/ {quota?.limits.maxSources ?? 5}</span>
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-1">
              <span className="text-muted-foreground font-medium">Keywords Quota</span>
              <p className="font-bold text-lg text-foreground font-heading">
                {quota?.usage.keywords ?? 0} <span className="text-xs font-normal text-muted-foreground">/ {quota?.limits.maxKeywords ?? 3}</span>
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-1">
              <span className="text-muted-foreground font-medium">Topics Quota</span>
              <p className="font-bold text-lg text-foreground font-heading">
                {quota?.usage.topics ?? 0} <span className="text-xs font-normal text-muted-foreground">/ {quota?.limits.maxTopics ?? 3}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications Preferences Card */}
      <Card className="border border-border/80 bg-card/90 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md border border-border/60 bg-secondary/80 text-foreground">
              <Bell className="size-3.5 text-primary" />
            </div>
            <span>Keyword Alert Notifications</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Receive automated email alerts whenever a newly ingested feed article matches one of your monitored keywords.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <form onSubmit={handleSaveNotifications} className="space-y-4">
            {notifSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                <span>Notification preferences updated successfully.</span>
              </div>
            )}

            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/15 p-3">
              <input
                type="checkbox"
                id="notifToggle"
                checked={notifEnabled}
                onChange={(e) => setNotifEnabled(e.target.checked)}
                className="size-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
              />
              <Label htmlFor="notifToggle" className="text-xs font-medium cursor-pointer text-foreground">
                Enable automated keyword match email alerts
              </Label>
            </div>

            <div className="space-y-1.5 max-w-md">
              <Label htmlFor="destEmail" className="text-xs flex items-center gap-1.5 font-medium">
                <Mail className="size-3.5 text-muted-foreground" />
                Destination Email
              </Label>
              <Input
                id="destEmail"
                type="email"
                value={notifEmail}
                onChange={(e) => setNotifEmail(e.target.value)}
                placeholder="alerts@company.com"
                className="h-8.5 text-xs bg-background/80"
                disabled={!notifEnabled || isSavingNotifs}
              />
              <p className="text-[11px] text-muted-foreground">
                Defaults to your account email address if left blank.
              </p>
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={isSavingNotifs}
              className="h-8.5 px-4 text-xs cursor-pointer shadow-xs"
            >
              {isSavingNotifs ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                "Save Alert Preferences"
              )}
            </Button>
          </form>

          {/* Recent Alert Log Delivery History */}
          <div className="pt-4 border-t border-border/50 space-y-2.5">
            <span className="text-xs font-semibold text-foreground tracking-tight">Recent Notification Log Deliveries</span>
            {notifHistory.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic py-1">
                No notification jobs triggered yet. They will appear here when incoming articles match active keywords.
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto rounded-xl border border-border/70 bg-muted/15 divide-y divide-border/40 text-xs">
                {notifHistory.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-2.5 flex items-center justify-between text-[11px] gap-2">
                    <div className="truncate max-w-[280px] sm:max-w-md">
                      <p className="font-medium text-foreground truncate">{log.subject}</p>
                      <p className="text-[10px] text-muted-foreground truncate">To: {log.recipientEmail}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-[9px] py-0 px-1.5 uppercase font-medium ${
                          log.status === "sent"
                            ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
                            : log.status === "skipped"
                            ? "text-amber-600 border-amber-500/30 bg-amber-500/10"
                            : "text-muted-foreground"
                        }`}
                      >
                        {log.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Session Card */}
      <Card className="border border-border/80 bg-card/90 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShieldCheck className="size-4 text-muted-foreground" />
            Account Session
          </CardTitle>
          <CardDescription className="text-xs">
            Manage your authenticated session and workspace access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sign out of your active session on this device. You will need to sign in again to access your feeds.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="h-8.5 px-4 text-xs gap-1.5 cursor-pointer shadow-xs"
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
