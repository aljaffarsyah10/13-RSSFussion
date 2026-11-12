"use client";

import * as React from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  CheckCircle2,
  Bookmark,
  Download,
  CheckSquare,
  Square,
  ArrowUpDown,
  Clock,
  Loader2,
  LayoutGrid,
  LayoutList,
  Keyboard,
} from "lucide-react";
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
  savedOnly?: boolean;
  onSavedOnlyChange?: (saved: boolean) => void;
  timeframe?: "all" | "today" | "3days" | "7days" | "30days";
  onTimeframeChange?: (timeframe: "all" | "today" | "3days" | "7days" | "30days") => void;
  sort?: "newest" | "oldest" | "title-asc";
  onSortChange?: (sort: "newest" | "oldest" | "title-asc") => void;
  availableSources: Array<{ id: string; name: string }>;
  availableTopics: Array<{ id: string; name: string }>;
  totalCount: number;

  // Bulk actions & export
  selectedCount?: number;
  onToggleSelectAll?: () => void;
  isAllSelected?: boolean;
  onBulkAction?: (action: "markRead" | "markUnread" | "save" | "unsave") => void;
  onMarkAllFeedRead?: () => void;
  isMarkingAllRead?: boolean;
  exportUrl?: string;

  // View density & shortcuts
  density?: "comfortable" | "compact";
  onDensityChange?: (d: "comfortable" | "compact") => void;
  onOpenShortcuts?: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
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
  savedOnly = false,
  onSavedOnlyChange,
  timeframe = "all",
  onTimeframeChange,
  sort = "newest",
  onSortChange,
  availableSources,
  availableTopics,
  totalCount,
  selectedCount = 0,
  onToggleSelectAll,
  isAllSelected = false,
  onBulkAction,
  onMarkAllFeedRead,
  isMarkingAllRead = false,
  exportUrl,
  density = "comfortable",
  onDensityChange,
  onOpenShortcuts,
  searchInputRef,
}: ArticleFiltersProps) {
  const [showExportMenu, setShowExportMenu] = React.useState(false);
  const [showMarkConfirm, setShowMarkConfirm] = React.useState(false);

  const hasActiveFilters = Boolean(
    searchQuery ||
      selectedSourceId ||
      selectedTopic ||
      (readStatus && readStatus !== "all") ||
      savedOnly ||
      (timeframe && timeframe !== "all") ||
      (sort && sort !== "newest")
  );

  const handleReset = () => {
    onSearchChange("");
    onSourceChange("");
    onTopicChange("");
    if (onReadStatusChange) onReadStatusChange("all");
    if (onSavedOnlyChange) onSavedOnlyChange(false);
    if (onTimeframeChange) onTimeframeChange("all");
    if (onSortChange) onSortChange("newest");
  };

  const selectedTopicName =
    availableTopics.find((t) => t.id === selectedTopic)?.name || selectedTopic;
  const selectedSourceName =
    availableSources.find((s) => s.id === selectedSourceId)?.name;

  return (
    <div className="space-y-3">
      {/* Main Filter Toolbar */}
      <div className="space-y-3 rounded-xl border border-border/80 bg-card/80 p-3 sm:p-4 shadow-2xs backdrop-blur-xs">
        {/* Row 1: Search + Dropdowns */}
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search headline or keywords... (Press / to focus)"
              className="h-8.5 pl-8 pr-7 text-xs bg-muted/30 border-border/70 focus-visible:bg-background transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                aria-label="Clear search"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Selectors Group */}
          <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
            {/* Source Selector */}
            <select
              value={selectedSourceId}
              onChange={(e) => onSourceChange(e.target.value)}
              className="h-8.5 rounded-lg border border-border/80 bg-background/80 px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer shadow-2xs transition-colors hover:border-border"
              aria-label="Filter by source"
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
              aria-label="Filter by topic"
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
                aria-label="Filter by read status"
              >
                <option value="all">All Status</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            )}

            {/* Timeframe Selector */}
            {onTimeframeChange && (
              <select
                value={timeframe}
                onChange={(e) => onTimeframeChange(e.target.value as "all" | "today" | "3days" | "7days" | "30days")}
                className="h-8.5 rounded-lg border border-border/80 bg-background/80 px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer shadow-2xs transition-colors hover:border-border"
                aria-label="Filter by timeframe"
              >
                <option value="all">All Time</option>
                <option value="today">Past 24 Hours</option>
                <option value="3days">Past 3 Days</option>
                <option value="7days">Past 7 Days</option>
                <option value="30days">Past 30 Days</option>
              </select>
            )}

            {/* Sort Selector */}
            {onSortChange && (
              <select
                value={sort}
                onChange={(e) => onSortChange(e.target.value as "newest" | "oldest" | "title-asc")}
                className="h-8.5 rounded-lg border border-border/80 bg-background/80 px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer shadow-2xs transition-colors hover:border-border"
                aria-label="Sort articles"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title-asc">Title (A-Z)</option>
              </select>
            )}

            {/* Saved Only Toggle Pill */}
            {onSavedOnlyChange && (
              <Button
                variant={savedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => onSavedOnlyChange(!savedOnly)}
                className="h-8.5 text-xs gap-1.5 px-3 cursor-pointer"
                title="Show bookmarked articles only"
              >
                <Bookmark className="size-3" />
                <span>Saved</span>
              </Button>
            )}

            {/* Reset Button */}
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

        {/* Row 2: Sub-bar (Result count, Chips, Quick Actions) */}
        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium text-foreground/80">
              <SlidersHorizontal className="size-3 text-muted-foreground" />
              <span>{totalCount} articles</span>
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
            {timeframe !== "all" && (
              <Badge variant="outline" className="text-[10px] py-0 px-2 border-border/60 gap-1">
                <Clock className="size-2.5" />
                {timeframe}
              </Badge>
            )}
            {sort !== "newest" && (
              <Badge variant="outline" className="text-[10px] py-0 px-2 border-border/60 gap-1">
                <ArrowUpDown className="size-2.5" />
                {sort}
              </Badge>
            )}
          </div>

          {/* Quick Actions (Mark All Read & Export) */}
          <div className="flex items-center gap-2 ml-auto">
            {onMarkAllFeedRead && (
              <>
                {showMarkConfirm ? (
                  <div className="flex items-center gap-1.5 animate-in fade-in-50 duration-150">
                    <span className="text-[11px] text-muted-foreground">Mark all read?</span>
                    <Button
                      variant="destructive"
                      size="xs"
                      onClick={() => {
                        setShowMarkConfirm(false);
                        onMarkAllFeedRead();
                      }}
                      disabled={isMarkingAllRead}
                      className="h-6 text-[10px] px-2 cursor-pointer"
                    >
                      {isMarkingAllRead ? <Loader2 className="size-2.5 animate-spin" /> : "Confirm"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setShowMarkConfirm(false)}
                      className="h-6 text-[10px] px-1.5 cursor-pointer"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setShowMarkConfirm(true)}
                    disabled={isMarkingAllRead || totalCount === 0}
                    className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Mark all read</span>
                  </Button>
                )}
              </>
            )}

            {/* View Density Switcher */}
            {onDensityChange && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => onDensityChange(density === "comfortable" ? "compact" : "comfortable")}
                className="h-7 text-xs gap-1.5 cursor-pointer shadow-2xs"
                title={density === "comfortable" ? "Switch to Compact List View" : "Switch to Card View"}
              >
                {density === "comfortable" ? (
                  <>
                    <LayoutList className="size-3 text-muted-foreground" />
                    <span className="hidden sm:inline">Compact</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="size-3 text-muted-foreground" />
                    <span className="hidden sm:inline">Cards</span>
                  </>
                )}
              </Button>
            )}

            {/* Keyboard Shortcuts Trigger */}
            {onOpenShortcuts && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onOpenShortcuts}
                className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Keyboard Shortcuts (?)"
              >
                <Keyboard className="size-3.5" />
                <span className="sr-only">Keyboard Shortcuts</span>
              </Button>
            )}

            {/* Export Dropdown */}
            {exportUrl && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setShowExportMenu((v) => !v)}
                  className="h-7 text-xs gap-1.5 cursor-pointer shadow-2xs"
                  title="Export articles"
                >
                  <Download className="size-3" />
                  <span>Export</span>
                </Button>

                {showExportMenu && (
                  <div
                    className="absolute right-0 top-full mt-1 z-30 w-44 rounded-xl border border-border/80 bg-popover p-1.5 shadow-lg backdrop-blur-md animate-in fade-in-50 zoom-in-95"
                    onClick={() => setShowExportMenu(false)}
                  >
                    <a
                      href={`${exportUrl}&format=csv`}
                      download
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-popover-foreground hover:bg-muted/70 transition-colors"
                    >
                      <Download className="size-3.5 text-muted-foreground" />
                      <span>Export as CSV</span>
                    </a>
                    <a
                      href={`${exportUrl}&format=markdown`}
                      download
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-popover-foreground hover:bg-muted/70 transition-colors"
                    >
                      <Download className="size-3.5 text-muted-foreground" />
                      <span>Export Markdown (.md)</span>
                    </a>
                    <a
                      href={`${exportUrl}&format=json`}
                      download
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-popover-foreground hover:bg-muted/70 transition-colors"
                    >
                      <Download className="size-3.5 text-muted-foreground" />
                      <span>Export as JSON</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Bar when articles are selected */}
      {selectedCount > 0 && onBulkAction && (
        <div className="sticky top-16 z-20 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-card/95 p-2.5 sm:px-4 shadow-md backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            {onToggleSelectAll && (
              <Button
                variant="ghost"
                size="xs"
                onClick={onToggleSelectAll}
                className="h-7 text-xs gap-1.5 cursor-pointer text-foreground font-medium"
              >
                {isAllSelected ? (
                  <CheckSquare className="size-3.5 text-primary" />
                ) : (
                  <Square className="size-3.5 text-muted-foreground" />
                )}
                <span>{selectedCount} selected</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => onBulkAction("markRead")}
              className="h-7 text-xs gap-1 cursor-pointer"
            >
              <CheckCircle2 className="size-3 text-emerald-500" />
              <span>Mark Read</span>
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => onBulkAction("markUnread")}
              className="h-7 text-xs gap-1 cursor-pointer"
            >
              <span className="size-1.5 rounded-full bg-blue-500" />
              <span>Mark Unread</span>
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => onBulkAction("save")}
              className="h-7 text-xs gap-1 cursor-pointer"
            >
              <Bookmark className="size-3 text-amber-500" />
              <span>Save</span>
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onBulkAction("unsave")}
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <span>Unsave</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
