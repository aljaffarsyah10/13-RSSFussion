import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Ideal for individual enthusiasts monitoring essential personal blogs.",
    badge: "Current Free",
    features: [
      "5 RSS / Atom Sources",
      "3 Watch Keywords",
      "3 Topics",
      "60-minute Fetch Frequency",
      "Exact-Phrase Keyword Matching",
      "Saved Articles Storage",
      "OPML Import & Export",
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
      "Feed Health Diagnostics & Logs",
      "Saved Articles Archive",
      "Automated Email Alerts",
    ],
    cta: "Start Starter Plan",
    href: "/dashboard",
    variant: "outline" as const,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/ month",
    description: "For media monitors, analysts, and business intelligence teams.",
    badge: "Most Popular",
    highlight: true,
    features: [
      "100 RSS / Atom Sources",
      "100 Watch Keywords",
      "100 Topics",
      "15-minute Fetch Frequency",
      "Interactive 7-day Trend Analytics",
      "Instant Resend Email Alerts",
      "Priority Background Ingestion Queue",
    ],
    cta: "Upgrade to Pro",
    href: "/dashboard",
    variant: "default" as const,
  },
  {
    name: "Business",
    price: "Custom",
    period: "",
    description: "High-volume aggregation for large intelligence operations.",
    features: [
      "Unlimited Configurable Sources",
      "Unlimited Keywords & Topics",
      "Real-time Ingestion Worker Pool",
      "Dedicated PostgreSQL Instance",
      "Custom Webhook & API Access",
      "Dedicated Support SLA",
    ],
    cta: "Contact Enterprise",
    href: "/dashboard",
    variant: "outline" as const,
  },
];

export default function PricingPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center space-y-3">
        <Badge variant="secondary" className="text-xs px-3 py-1 font-medium">
          Pricing & Subscriptions
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl font-heading">
          Transparent, Predictable Plans
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base leading-relaxed">
          Start free with core RSS intelligence. Scale your quota effortlessly as your monitoring footprint expands.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-stretch">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`flex flex-col justify-between border-border/80 bg-card/90 transition-all duration-200 ${
              plan.highlight
                ? "border-primary ring-2 ring-primary/30 shadow-md relative scale-[1.02] bg-card"
                : "hover:border-primary/40 shadow-2xs"
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-xs">
                  <Sparkles className="size-2.5" />
                  Most Popular
                </span>
              </div>
            )}

            <CardHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold font-heading">{plan.name}</CardTitle>
                {plan.badge && !plan.highlight && (
                  <Badge variant="secondary" className="text-[10px] py-0 px-2 font-medium">
                    {plan.badge}
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground min-h-[36px] leading-relaxed">
                {plan.description}
              </p>
              <div className="mt-4 flex items-baseline gap-1.5 pt-2 border-t border-border/50">
                <span className="text-3xl font-extrabold text-foreground font-heading">
                  {plan.price}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {plan.period}
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-6 pt-2 flex-1">
              <ul className="space-y-3 text-xs text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="size-3.5 shrink-0 text-emerald-500 mt-0.5" />
                    <span className="leading-tight text-foreground/90">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="p-6 pt-0">
              <Link
                href={plan.href}
                className={buttonVariants({
                  variant: plan.variant,
                  className: "w-full text-xs h-9 font-medium shadow-xs",
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
