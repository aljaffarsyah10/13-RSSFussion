"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlanManageDialog } from "@/features/billing/components/plan-manage-dialog";
import {
  quotaApi,
  authApi,
  notificationsApi,
  userApi,
  billingApi,
  QuotaUsage,
} from "@/lib/api/client";
import {
  UserProfile,
  SubscriptionRecord,
  BillingInvoice,
  SubscriptionPlan,
  BillingCycle,
} from "@/types/models";
import {
  LogOut,
  Loader2,
  Bell,
  CheckCircle2,
  ShieldCheck,
  Mail,
  Sparkles,
  User,
  Building2,
  KeyRound,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [subscription, setSubscription] = React.useState<SubscriptionRecord | null>(null);
  const [invoices, setInvoices] = React.useState<BillingInvoice[]>([]);
  const [quota, setQuota] = React.useState<QuotaUsage | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // Profile Form State
  const [fullName, setFullName] = React.useState("");
  const [orgName, setOrgName] = React.useState("");
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [profileSuccess, setProfileSuccess] = React.useState(false);

  // Password State
  const [newPassword, setNewPassword] = React.useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);
  const [passwordSuccess, setPasswordSuccess] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  // Email notifications state
  const [notifEnabled, setNotifEnabled] = React.useState(true);
  const [notifEmail, setNotifEmail] = React.useState("");
  const [isSavingNotifs, setIsSavingNotifs] = React.useState(false);
  const [notifSuccess, setNotifSuccess] = React.useState(false);
  const [notifHistory, setNotifHistory] = React.useState<
    Array<{ id: string; subject: string; recipientEmail: string; status: string; createdAt: string }>
  >([]);

  // Plan dialog
  const [isPlanModalOpen, setIsPlanModalOpen] = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      userApi.getProfile().catch(() => null),
      billingApi.getSubscription().catch(() => null),
      billingApi.listInvoices().catch(() => []),
      quotaApi.getQuota().catch(() => null),
      notificationsApi.getSettings().catch(() => null),
      notificationsApi.listHistory().catch(() => []),
    ])
      .then(([uProfile, sub, invList, qRes, nSettings, nHistory]) => {
        if (uProfile) {
          setProfile(uProfile);
          setFullName(uProfile.fullName || "");
          setOrgName(uProfile.organizationName || "");
        }
        if (sub) setSubscription(sub);
        if (invList) setInvoices(invList);
        if (qRes) setQuota(qRes);
        if (nSettings) {
          setNotifEnabled(nSettings.emailNotificationsEnabled);
          setNotifEmail(nSettings.notificationEmail);
        }
        if (nHistory) setNotifHistory(nHistory);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccess(false);

    try {
      const updated = await userApi.updateProfile({
        fullName,
        organizationName: orgName,
      });
      setProfile(updated);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await userApi.updatePassword(newPassword);
      setPasswordSuccess(true);
      setNewPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

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

  const handlePlanUpdated = async () => {
    // Refresh subscription, quota, invoices
    const [sub, qRes, invList] = await Promise.all([
      billingApi.getSubscription().catch(() => null),
      quotaApi.getQuota().catch(() => null),
      billingApi.listInvoices().catch(() => []),
    ]);
    if (sub) setSubscription(sub);
    if (qRes) setQuota(qRes);
    if (invList) setInvoices(invList);
    if (profile && sub?.plan) setProfile({ ...profile, plan: sub.plan });
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
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  const activePlan: SubscriptionPlan = (subscription?.plan || (quota?.plan as SubscriptionPlan) || "free");
  const planName = activePlan.charAt(0).toUpperCase() + activePlan.slice(1) + " Plan";

  const sourcesPct = quota?.percentages?.sources ?? 0;
  const keywordsPct = quota?.percentages?.keywords ?? 0;
  const topicsPct = quota?.percentages?.topics ?? 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings & Workspace"
        description="Manage your user identity, plan capacity, and intelligence ingestion preferences."
      />

      {/* Plan Dialog Modal */}
      <PlanManageDialog
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        currentPlan={activePlan}
        currentCycle={subscription?.billingCycle || "monthly"}
        onPlanUpdated={handlePlanUpdated}
      />

      {/* 1. Subscription & Quota Card */}
      <Card className="border border-border/80 bg-card/90 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                <span>Subscription & Resource Capacity</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Active plan resource allowances and real-time usage meters.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-2.5 py-1 text-xs font-semibold capitalize">
                {planName} ({subscription?.billingCycle || "monthly"})
              </Badge>
              <Button
                size="sm"
                onClick={() => setIsPlanModalOpen(true)}
                className="h-8 px-3 text-xs gap-1 cursor-pointer shadow-xs"
              >
                <span>Upgrade / Change</span>
                <ArrowUpRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Warning Banner if Near Limit */}
          {quota?.isNearLimit && (
            <div className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs ${
              quota.isAtLimit
                ? "bg-destructive/10 border-destructive/20 text-destructive font-medium"
                : "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200"
            }`}>
              <AlertTriangle className="size-4 shrink-0" />
              <div className="flex-1 flex items-center justify-between gap-2 flex-wrap">
                <span>
                  {quota.isAtLimit
                    ? "You have reached your plan limit on one or more resources. Upgrade your plan to add more."
                    : "You are approaching 80%+ of your plan capacity. Consider upgrading to avoid ingestion interruptions."}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPlanModalOpen(true)}
                  className="h-6.5 text-[11px] px-2.5 ml-auto"
                >
                  View Plans
                </Button>
              </div>
            </div>
          )}

          {/* Usage Meters with Progress Bars */}
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            {/* Sources Meter */}
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-2">
              <div className="flex justify-between items-center text-muted-foreground font-medium">
                <span>RSS Sources</span>
                <span className="font-semibold text-foreground">{sourcesPct}%</span>
              </div>
              <p className="font-bold text-lg text-foreground font-heading">
                {quota?.usage.sources ?? 0}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  / {quota?.limits.maxSources ?? 5}
                </span>
              </p>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    sourcesPct >= 90 ? "bg-destructive" : sourcesPct >= 75 ? "bg-amber-500" : "bg-primary"
                  }`}
                  style={{ width: `${sourcesPct}%` }}
                />
              </div>
            </div>

            {/* Keywords Meter */}
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-2">
              <div className="flex justify-between items-center text-muted-foreground font-medium">
                <span>Watch Keywords</span>
                <span className="font-semibold text-foreground">{keywordsPct}%</span>
              </div>
              <p className="font-bold text-lg text-foreground font-heading">
                {quota?.usage.keywords ?? 0}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  / {quota?.limits.maxKeywords ?? 3}
                </span>
              </p>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    keywordsPct >= 90 ? "bg-destructive" : keywordsPct >= 75 ? "bg-amber-500" : "bg-primary"
                  }`}
                  style={{ width: `${keywordsPct}%` }}
                />
              </div>
            </div>

            {/* Topics Meter */}
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-2">
              <div className="flex justify-between items-center text-muted-foreground font-medium">
                <span>Monitored Topics</span>
                <span className="font-semibold text-foreground">{topicsPct}%</span>
              </div>
              <p className="font-bold text-lg text-foreground font-heading">
                {quota?.usage.topics ?? 0}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  / {quota?.limits.maxTopics ?? 3}
                </span>
              </p>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    topicsPct >= 90 ? "bg-destructive" : topicsPct >= 75 ? "bg-amber-500" : "bg-primary"
                  }`}
                  style={{ width: `${topicsPct}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. User Profile & Workspace Card */}
      <Card className="border border-border/80 bg-card/90 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span>Profile & Workspace</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Manage your account credentials and team workspace context.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
              {profile?.role || "Owner"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {profileSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                <span>Profile details saved successfully.</span>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="profName" className="text-xs font-medium">
                  Full Name
                </Label>
                <Input
                  id="profName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Name"
                  className="h-8.5 text-xs bg-background/80"
                  disabled={isSavingProfile}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="profEmail" className="text-xs font-medium">
                  Account Email
                </Label>
                <Input
                  id="profEmail"
                  value={profile?.email || ""}
                  disabled
                  className="h-8.5 text-xs bg-muted/40 cursor-not-allowed opacity-80"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="profOrg" className="text-xs font-medium flex items-center gap-1.5">
                  <Building2 className="size-3 text-muted-foreground" />
                  Organization / Workspace Name
                </Label>
                <Input
                  id="profOrg"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Acme Intelligence, Personal Beat"
                  className="h-8.5 text-xs bg-background/80"
                  disabled={isSavingProfile}
                />
              </div>
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={isSavingProfile}
              className="h-8.5 px-4 text-xs cursor-pointer shadow-xs"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                "Save Profile Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 3. Invoices & Billing History Card */}
      <Card className="border border-border/80 bg-card/90 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Receipt className="size-4 text-muted-foreground" />
            <span>Billing Invoices & Receipts</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Download and review your subscription statements and payment records.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {invoices.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">
              No invoice records on file yet. Receipts will automatically be posted here upon plan upgrades.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/30 border-b border-border/40 text-[11px] text-muted-foreground">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Invoice #</th>
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold">Plan</th>
                    <th className="py-2.5 px-3 font-semibold">Amount</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/15 transition-colors">
                      <td className="py-2 px-3 font-mono font-medium">{inv.invoiceNumber}</td>
                      <td className="py-2 px-3 text-muted-foreground">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3 capitalize font-medium">{inv.plan}</td>
                      <td className="py-2 px-3 font-bold">${(inv.amountCents / 100).toFixed(2)}</td>
                      <td className="py-2 px-3">
                        <Badge
                          variant="outline"
                          className="text-[9px] uppercase font-bold text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
                        >
                          {inv.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Keyword Alert Notifications Card */}
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

      {/* 5. Security & Password Update Card */}
      <Card className="border border-border/80 bg-card/90 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" />
            <span>Security & Authentication</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Update your account password and security credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
            {passwordSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                <span>Password updated successfully.</span>
              </div>
            )}

            {passwordError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
                {passwordError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="newPass" className="text-xs font-medium">
                New Password (minimum 8 characters)
              </Label>
              <Input
                id="newPass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="h-8.5 text-xs bg-background/80"
                disabled={isUpdatingPassword}
              />
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={isUpdatingPassword || !newPassword}
              className="h-8.5 px-4 text-xs cursor-pointer shadow-xs"
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 6. Account Session & Sign Out Card */}
      <Card className="border border-border/80 bg-card/90 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShieldCheck className="size-4 text-muted-foreground" />
            <span>Account Session</span>
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
