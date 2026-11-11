"use client";

import * as React from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ArticleFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedSourceId: string;
  onSourceChange: (sourceId: string) => void;
  selectedTopic: string;
  onTopicChange: (topic: string) => void;
  readStatus?: "all" | "unread" | "read";
  onReadStatusChange?: (status: "all" | "unread" | "read") => void;
  availableSources: Array<{ id: string; name: string }>;
  availableTopics: Array<{ id: string; name: string }>;
  totalCount: number;
}

export function ArticleFilters({
  searchQuery,
  onSearchChange,
  selectedSourceId,
  onSourceChange,
  selectedTopic,
  onTopicChange,
  readStatus = "all",
  onReadStatusChange,
  availableSources,
  availableTopics,
  totalCount,
}: ArticleFiltersProps) {
  const hasActiveFilters = Boolean(
    searchQuery || selectedSourceId || selectedTopic || (readStatus && readStatus !== "all")
  );

  const handleReset = () => {
    onSearchChange("");
    onSourceChange("");
    onTopicChange("");
    if (onReadStatusChange) onReadStatusChange("all");
  };

  const selectedTopicName = availableTopics.find((t) => t.id === selectedTopic)?.name || selectedTopic;
  const selectedSourceName = availableSources.find((s) => s.id === selectedSourceId)?.name;

  return (
    <div className="space-y-3 rounded-xl border border-border/80 bg-card/80 p-3 sm:p-4 shadow-2xs backdrop-blur-xs">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search headline or keywords..."
            className="h-8.5 pl-8 pr-7 text-xs bg-muted/30 border-border/70 focus-visible:bg-background transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* Source Selector */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={selectedSourceId}
            onChange={(e) => onSourceChange(e.target.value)}
            className="h-8.5 rounded-lg border border-border/80 bg-background/80 px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer shadow-2xs transition-colors hover:border-border"
          >
            <option value="">All Sources</option>
            {availableSources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Topic Selector */}
          <select
            value={selectedTopic}
            onChange={(e) => onTopicChange(e.target.value)}
            className="h-8.5 rounded-lg border border-border/80 bg-background/80 px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer shadow-2xs transition-colors hover:border-border"
          >
            <option value="">All Topics</option>
            {availableTopics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Read Status Selector */}
          {onReadStatusChange && (
            <select
              value={readStatus}
              onChange={(e) => onReadStatusChange(e.target.value as "all" | "unread" | "read")}
              className="h-8.5 rounded-lg border border-border/80 bg-background/80 px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer shadow-2xs transition-colors hover:border-border"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          )}

          {/* Reset */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8.5 text-xs text-muted-foreground hover:text-foreground gap-1 px-2.5 cursor-pointer hover:bg-muted/60"
            >
              <X className="size-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Active Filter Chips & Results Count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 font-medium text-foreground/80">
            <SlidersHorizontal className="size-3 text-muted-foreground" />
            <span>{totalCount} articles found</span>
          </span>
          {selectedSourceId && (
            <Badge variant="secondary" className="text-[10px] py-0 px-2 border border-border/60">
              Source: {selectedSourceName}
            </Badge>
          )}
          {selectedTopic && (
            <Badge variant="secondary" className="text-[10px] py-0 px-2 border border-border/60">
              Topic: {selectedTopicName}
            </Badge>
          )}
          {readStatus !== "all" && (
            <Badge variant="secondary" className="text-[10px] py-0 px-2 border border-border/60 uppercase">
              {readStatus}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
