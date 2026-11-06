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
import { cn } from "cn";

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

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="border-b border-border/60 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
            <Rss className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-foreground">
              RSSFusion
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              Information Intelligence
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase px-2">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
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
                        "gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-secondary text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
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

      <SidebarFooter className="border-t border-border/60 p-3 space-y-3">
        {/* Quota Progress Pill */}
        <div className="rounded-lg border border-border bg-card/60 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">Free Plan</span>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
              0 / 5
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Sources connected
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: "0%" }} />
          </div>
        </div>

        {/* User row placeholder */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <User className="size-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground">Guest User</span>
              <span className="text-[10px] text-muted-foreground">Free Tier</span>
            </div>
          </div>
          <Link
            href="/"
            title="Public Site"
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
