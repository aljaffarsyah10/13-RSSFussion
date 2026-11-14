"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BillingCycle, SubscriptionPlan } from "@/types/models";
import { billingApi } from "@/lib/api/client";
import { Check, Loader2, Sparkles, Zap } from "lucide-react";

interface PlanManageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: SubscriptionPlan;
  currentCycle?: BillingCycle;
  onPlanUpdated: () => void;
}

const PLAN_TIERS: Array<{
  id: SubscriptionPlan;
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  description: string;
  features: string[];
  popular?: boolean;
}> = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: "$0",
    annualPrice: "$0",
    description: "Core feeds for individual readers",
    features: ["5 Sources", "3 Keywords", "3 Topics", "60m fetch interval", "OPML import/export"],
  },
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: "$9",
    annualPrice: "$90",
    description: "Active curators & researchers",
    features: ["30 Sources", "20 Keywords", "20 Topics", "30m fetch interval", "Feed health logs"],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: "$29",
    annualPrice: "$290",
    description: "Teams & power intelligence monitors",
    features: [
      "100 Sources",
      "100 Keywords",
      "100 Topics",
      "15m fetch interval",
      "7-day trend analytics",
      "Instant email alerts",
    ],
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: "$99",
    annualPrice: "$990",
    description: "Enterprise scale newsrooms",
    features: [
      "Unlimited Sources",
      "Unlimited Keywords",
      "Unlimited Topics",
      "Dedicated worker pool",
      "Priority webhook API",
      "Custom SLA support",
    ],
  },
];

function PlanManageDialogBody({
  currentPlan,
  currentCycle,
  onClose,
  onPlanUpdated,
}: {
  currentPlan: SubscriptionPlan;
  currentCycle: BillingCycle;
  onClose: () => void;
  onPlanUpdated: () => void;
}) {
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan>(currentPlan);
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>(currentCycle);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleConfirmPlan = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await billingApi.changePlan(selectedPlan, billingCycle);
      onPlanUpdated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update subscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold">Manage Subscription Plan</DialogTitle>
            <DialogDescription className="text-xs">
              Select your resource capacity. Scale up or down anytime with instant quota adjustment.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {/* Billing Cycle Switcher */}
      <div className="flex items-center justify-center gap-3 pt-2 pb-1">
        <div className="inline-flex rounded-lg border border-border/80 bg-muted/30 p-1 text-xs">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              billingCycle === "monthly"
                ? "bg-card text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("annual")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              billingCycle === "annual"
                ? "bg-card text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Annual Billing</span>
            <span className="rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] px-1 font-bold">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Plan Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2 pt-2">
        {PLAN_TIERS.map((tier) => {
          const isSelected = selectedPlan === tier.id;
          const isCurrent = currentPlan === tier.id && currentCycle === billingCycle;
          const price = billingCycle === "annual" ? tier.annualPrice : tier.monthlyPrice;
          const period = billingCycle === "annual" ? "/ year" : "/ month";

          return (
            <div
              key={tier.id}
              onClick={() => setSelectedPlan(tier.id)}
              className={`relative rounded-xl border p-4 cursor-pointer transition-all ${
                isSelected
                  ? "border-primary bg-primary/4 ring-2 ring-primary/40 shadow-xs"
                  : "border-border/70 bg-card hover:border-border hover:bg-muted/20"
              }`}
            >
              {tier.popular && (
                <Badge className="absolute -top-2.5 right-3 text-[10px] py-0 px-2 font-semibold bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}

              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  {tier.name}
                  {isCurrent && (
                    <span className="text-[10px] text-muted-foreground font-normal">(Current)</span>
                  )}
                </h4>
                <div className="text-right">
                  <span className="font-extrabold text-base text-foreground font-heading">{price}</span>
                  <span className="text-[10px] text-muted-foreground ml-0.5">{tier.id === "free" ? "" : period}</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{tier.description}</p>

              <ul className="mt-3 space-y-1.5 border-t border-border/40 pt-2.5">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Check className="size-3 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <DialogFooter className="gap-2 pt-3 border-t border-border/40">
        <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading} className="text-xs">
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleConfirmPlan}
          disabled={isLoading || (selectedPlan === currentPlan && billingCycle === currentCycle)}
          className="text-xs gap-1.5 cursor-pointer shadow-xs"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Zap className="size-3.5" />
              <span>
                {selectedPlan === currentPlan ? "Update Billing Cycle" : `Switch to ${selectedPlan.toUpperCase()} Plan`}
              </span>
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function PlanManageDialog({
  isOpen,
  onClose,
  currentPlan,
  currentCycle = "monthly",
  onPlanUpdated,
}: PlanManageDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {isOpen && (
        <PlanManageDialogBody
          currentPlan={currentPlan}
          currentCycle={currentCycle}
          onClose={onClose}
          onPlanUpdated={onPlanUpdated}
        />
      )}
    </Dialog>
  );
}
