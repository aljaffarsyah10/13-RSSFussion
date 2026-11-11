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
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-background/85 px-4 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="hover:bg-muted/70 transition-colors" />
        <Separator orientation="vertical" className="h-4 bg-border/60" />
        <div className="flex items-center gap-1.5 text-xs sm:text-sm">
          <span className="text-muted-foreground hidden sm:inline font-medium">Workspace</span>
          <span className="text-muted-foreground/50 hidden sm:inline">/</span>
          <span className="font-semibold text-foreground tracking-tight">{currentTitle}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="relative hidden w-52 sm:block md:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Quick search... (Press Enter)"
            className="h-8 pl-8 pr-8 text-xs bg-muted/30 border-border/70 focus-visible:bg-background transition-colors"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:flex items-center gap-0.5 rounded border border-border/60 bg-muted/60 px-1 py-0.5 text-[9px] font-mono text-muted-foreground">
            <span>↵</span>
          </div>
        </div>

        <Link
          href="/pricing"
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "h-8 text-xs gap-1.5 hidden md:flex border-border/80 hover:border-border",
          })}
        >
          <Sparkles className="size-3 text-amber-500" />
          <span className="font-medium">Upgrade</span>
        </Link>

        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <Bell className="size-4" />
          <span className="sr-only">Notifications</span>
        </Button>
      </div>
    </header>
  );
}
