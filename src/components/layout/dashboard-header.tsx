"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Bell, Sparkles } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/articles": "Article Feed",
  "/dashboard/sources": "RSS Sources",
  "/dashboard/topics": "Topics",
  "/dashboard/keywords": "Keywords",
  "/dashboard/saved": "Saved Articles",
  "/dashboard/settings": "Settings",
};

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [headerSearch, setHeaderSearch] = React.useState("");
  const currentTitle = pageTitles[pathname] || "Dashboard";

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && headerSearch.trim()) {
      router.push(`/dashboard/articles?q=${encodeURIComponent(headerSearch.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      <div className="flex items-center gap-2.5">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground hidden sm:inline">Workspace</span>
          <span className="text-muted-foreground hidden sm:inline">/</span>
          <span className="font-semibold text-foreground">{currentTitle}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="relative hidden w-48 lg:w-64 sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Quick search... (Press Enter)"
            className="h-8 pl-8 pr-3 text-xs bg-muted/40 border-border"
          />
        </div>

        <Link
          href="/pricing"
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "h-8 text-xs gap-1.5 hidden md:flex",
          })}
        >
          <Sparkles className="size-3 text-amber-500" />
          <span>Upgrade</span>
        </Link>

        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
          <Bell className="size-4" />
          <span className="sr-only">Notifications</span>
        </Button>
      </div>
    </header>
  );
}
