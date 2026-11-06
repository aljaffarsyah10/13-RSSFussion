import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
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
            <Badge variant="secondary">Free Plan</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-md border border-border p-3">
              <span className="text-muted-foreground">Sources Quota</span>
              <p className="mt-1 font-bold text-base text-foreground">0 / 5</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <span className="text-muted-foreground">Keywords Quota</span>
              <p className="mt-1 font-bold text-base text-foreground">0 / 3</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <span className="text-muted-foreground">Topics Quota</span>
              <p className="mt-1 font-bold text-base text-foreground">0 / 3</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Card */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Account Profile</CardTitle>
          <CardDescription className="text-xs">
            Personal identity information associated with your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">Full Name</Label>
              <Input id="name" defaultValue="Guest User" className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Email Address</Label>
              <Input id="email" defaultValue="guest@rssfusion.local" disabled className="h-9 text-xs" />
            </div>
          </div>
          <Button size="sm" className="h-8 text-xs">Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
