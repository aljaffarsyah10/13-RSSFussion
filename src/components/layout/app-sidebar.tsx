"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  Globe,
  FolderTree,
  Tag,
  Bookmark,
  Settings,
  Rss,
  ExternalLink,
  User,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { quotaApi, QuotaUsage } from "@/lib/api/client";

const navigationItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "Articles",
    href: "/dashboard/articles",
    icon: Newspaper,
  },
  {
    title: "Sources",
    href: "/dashboard/sources",
    icon: Globe,
  },
  {
    title: "Topics",
    href: "/dashboard/topics",
    icon: FolderTree,
  },
  {
    title: "Keywords",
    href: "/dashboard/keywords",
    icon: Tag,
  },
  {
    title: "Saved Articles",
    href: "/dashboard/saved",
    icon: Bookmark,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [quota, setQuota] = React.useState<QuotaUsage | null>(null);

  React.useEffect(() => {
    quotaApi
      .getQuota()
      .then((res) => setQuota(res))
      .catch(() => {});
  }, [pathname]);

  const sourcesUsed = quota?.usage.sources ?? 0;
  const sourcesMax = quota?.limits.maxSources ?? 5;
  const percentage = Math.min(Math.round((sourcesUsed / sourcesMax) * 100), 100);
  const planLabel = quota?.plan
    ? quota.plan.charAt(0).toUpperCase() + quota.plan.slice(1) + " Plan"
    : "Free Plan";

  return (
    <Sidebar className="border-r border-border/80 bg-sidebar/95 backdrop-blur-md">
      <SidebarHeader className="border-b border-border/60 px-4 py-3.5">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex size-7.5 items-center justify-center rounded-lg bg-foreground text-background shadow-xs transition-transform duration-200 group-hover:scale-105">
            <Rss className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-foreground font-heading">
              RSSFusion
            </span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-tight">
              Information Intelligence
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2.5 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase px-2 mb-1">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navigationItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      className={cn(
                        "gap-3 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-150",
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/60 p-3 space-y-3 bg-muted/10">
        {/* Quota Progress Pill */}
        <div className="rounded-xl border border-border/80 bg-card/80 p-3 shadow-2xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground text-[11px] flex items-center gap-1">
              <Sparkles className="size-3 text-amber-500" />
              {planLabel}
            </span>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-border/70 font-mono">
              {sourcesUsed} / {sourcesMax}
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Sources capacity used
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-secondary/80 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* User row */}
        <div className="flex items-center justify-between px-1 pt-0.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border/60 bg-secondary text-muted-foreground">
              <User className="size-3.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-foreground truncate">Workspace User</span>
              <span className="text-[10px] text-muted-foreground truncate">{planLabel}</span>
            </div>
          </div>
          <Link
            href="/"
            title="Visit public landing page"
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
