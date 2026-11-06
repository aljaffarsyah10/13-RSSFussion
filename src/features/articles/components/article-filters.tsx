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
  availableSources,
  availableTopics,
  totalCount,
}: ArticleFiltersProps) {
  const hasActiveFilters = Boolean(searchQuery || selectedSourceId || selectedTopic);

  const handleReset = () => {
    onSearchChange("");
    onSourceChange("");
    onTopicChange("");
  };

  const selectedTopicName = availableTopics.find((t) => t.id === selectedTopic)?.name || selectedTopic;
  const selectedSourceName = availableSources.find((s) => s.id === selectedSourceId)?.name;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-3 sm:p-4">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search headline or keywords..."
            className="h-8 pl-8 text-xs bg-muted/40"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* Source Selector */}
        <select
          value={selectedSourceId}
          onChange={(e) => onSourceChange(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All Topics</option>
          {availableTopics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {/* Reset */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1 px-2 cursor-pointer"
          >
            <X className="size-3" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {/* Active Filter Chips & Results Count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal className="size-3" />
          <span>Showing {totalCount} loaded articles</span>
          {selectedSourceId && (
            <Badge variant="secondary" className="text-[10px] py-0">
              Source: {selectedSourceName}
            </Badge>
          )}
          {selectedTopic && (
            <Badge variant="secondary" className="text-[10px] py-0">
              Topic: {selectedTopicName}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
