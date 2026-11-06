import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Ideal for individual enthusiasts monitoring essential personal blogs.",
    badge: "Current",
    features: [
      "5 RSS / Atom Sources",
      "3 Watch Keywords",
      "3 Topics",
      "60-minute Fetch Frequency",
      "Basic Keyword Matching",
      "Saved Articles Storage",
    ],
    cta: "Get Started Free",
    href: "/dashboard",
    variant: "outline" as const,
  },
  {
    name: "Starter",
    price: "$9",
    period: "/ month",
    description: "For active researchers and digital creators tracking specialized beats.",
    features: [
      "30 RSS / Atom Sources",
      "20 Watch Keywords",
      "20 Topics",
      "30-minute Fetch Frequency",
      "Feed Health Diagnostics",
      "Saved Articles Archive",
    ],
    cta: "Start Starter Plan",
    href: "/dashboard",
    variant: "default" as const,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/ month",
    description: "For media monitors, analysts, and business intelligence teams.",
    badge: "Most Popular",
    features: [
      "100 RSS / Atom Sources",
      "100 Watch Keywords",
      "100 Topics",
      "15-minute Fetch Frequency",
      "Advanced Trend Insights (P1)",
      "Instant Email Digests (P1)",
      "Priority Background Queue",
    ],
    cta: "Upgrade to Pro",
    href: "/dashboard",
    variant: "default" as const,
  },
  {
    name: "Business",
    price: "Custom",
    period: "",
    description: "Custom feeds and enterprise-grade ingestion volume.",
    features: [
      "Unlimited Configurable Sources",
      "Unlimited Keywords & Topics",
      "Real-time Ingestion Worker",
      "Dedicated Database Pool",
      "Custom Webhook & API Access",
      "SLA Support Guarantee",
    ],
    cta: "Contact Team",
    href: "/dashboard",
    variant: "outline" as const,
  },
];

export default function PricingPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Transparent, Predictable Plans
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Start free with core RSS intelligence. Scale up as your monitoring footprint expands.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`flex flex-col justify-between border-border ${
              plan.badge === "Most Popular"
                ? "border-primary ring-1 ring-primary shadow-sm"
                : ""
            }`}
          >
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">{plan.name}</CardTitle>
                {plan.badge && (
                  <Badge variant="secondary" className="text-[10px] py-0 px-2">
                    {plan.badge}
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground min-h-[32px]">
                {plan.description}
              </p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-foreground">
                  {plan.price}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {plan.period}
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-2 flex-1">
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="size-3.5 shrink-0 text-emerald-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="p-5 pt-0">
              <Link
                href={plan.href}
                className={buttonVariants({
                  variant: plan.variant,
                  className: "w-full text-xs h-9",
                })}
              >
                {plan.cta}
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
