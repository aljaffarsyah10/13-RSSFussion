"use client";

import * as React from "react";
import { Article } from "@/types/models";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Globe,
  CheckCircle2,
  Calendar,
  BookOpen,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ArticleCardProps {
  article: Article;
  onToggleSave?: (articleId: string) => void;
  onToggleRead?: (articleId: string) => void;
  onOpenReader?: (article: Article) => void;
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (articleId: string) => void;
  className?: string;
}

export function ArticleCard({
  article,
  onToggleSave,
  onToggleRead,
  onOpenReader,
  selectable = false,
  isSelected = false,
  onToggleSelect,
  className,
}: ArticleCardProps) {
  const [copied, setCopied] = React.useState(false);

  // Format readable timestamp
  const formattedDate = React.useMemo(() => {
    try {
      const d = new Date(article.publishedAt);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return article.publishedAt;
    }
  }, [article.publishedAt]);

  const readingTimeMin = React.useMemo(() => {
    const text = (article.contentSnippet || article.description || "") + " " + article.title;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 180));
  }, [article]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(article.canonicalUrl || article.originalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border border-border/80 bg-card/90 transition-all duration-200 hover:border-primary/40 hover:shadow-sm",
        article.isRead && "opacity-75 bg-muted/20 border-border/40",
        isSelected && "ring-2 ring-primary border-primary bg-primary/2",
        className
      )}
    >
      <CardContent className="p-4.5 sm:p-5">
        {/* Header Metadata */}
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            {selectable && onToggleSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(article.id)}
                className="size-4 rounded border-border accent-primary cursor-pointer shrink-0"
                aria-label={`Select article ${article.title}`}
              />
            )}

            {!article.isRead ? (
              <span
                className="size-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 shadow-xs ring-2 ring-blue-500/20"
                title="Unread article"
                aria-label="Unread"
              />
            ) : (
              <span
                className="size-1.5 rounded-full bg-muted-foreground/40 shrink-0"
                title="Read article"
                aria-label="Read"
              />
            )}
            <span className="flex items-center gap-1.5 font-semibold text-foreground tracking-tight">
              <Globe className="size-3.5 text-muted-foreground" />
              {article.sourceName}
            </span>
            <span className="text-muted-foreground/40">•</span>
            <time
              dateTime={article.publishedAt}
              className="flex items-center gap-1 text-[11px] text-muted-foreground"
            >
              <Calendar className="size-3 opacity-70" />
              {formattedDate}
            </time>
            <span className="text-muted-foreground/40 hidden sm:inline">•</span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground hidden sm:inline-flex">
              <Clock className="size-3 opacity-70" />
              {readingTimeMin} min read
            </span>
            {article.author && (
              <>
                <span className="text-muted-foreground/40 hidden sm:inline">•</span>
                <span className="truncate max-w-[140px] text-[11px] text-muted-foreground/80 hidden sm:inline">
                  by {article.author}
                </span>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {onOpenReader && (
              <Button
                variant="ghost"
                size="icon-xs"
                title="Open reader mode"
                onClick={() => onOpenReader(article)}
                className="size-7 text-muted-foreground/80 hover:text-foreground hover:bg-muted/70 cursor-pointer"
              >
                <BookOpen className="size-3.5" />
                <span className="sr-only">Reader View</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon-xs"
              title={copied ? "Link copied" : "Copy link"}
              onClick={handleCopy}
              className="size-7 text-muted-foreground/80 hover:text-foreground hover:bg-muted/70 cursor-pointer"
            >
              {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              <span className="sr-only">Copy link</span>
            </Button>

            {onToggleRead && (
              <Button
                variant="ghost"
                size="icon-xs"
                title={article.isRead ? "Mark as unread" : "Mark as read"}
                onClick={() => onToggleRead(article.id)}
                className={cn(
                  "size-7 text-muted-foreground/80 hover:text-foreground hover:bg-muted/70 cursor-pointer",
                  article.isRead && "text-emerald-600 dark:text-emerald-400"
                )}
              >
                <CheckCircle2 className="size-3.5" />
                <span className="sr-only">Toggle read</span>
              </Button>
            )}

            {onToggleSave && (
              <Button
                variant="ghost"
                size="icon-xs"
                title={article.isSaved ? "Remove from saved" : "Save article"}
                onClick={() => onToggleSave(article.id)}
                className={cn(
                  "size-7 text-muted-foreground/80 hover:text-foreground hover:bg-muted/70 cursor-pointer",
                  article.isSaved && "text-amber-500 hover:text-amber-600"
                )}
              >
                {article.isSaved ? (
                  <BookmarkCheck className="size-3.5 fill-amber-500 text-amber-500" />
                ) : (
                  <Bookmark className="size-3.5" />
                )}
                <span className="sr-only">Toggle save</span>
              </Button>
            )}

            <a
              href={article.originalUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              title="Open original website"
              className={buttonVariants({
                variant: "ghost",
                size: "icon-xs",
                className: "size-7 text-muted-foreground/80 hover:text-foreground hover:bg-muted/70 cursor-pointer",
              })}
            >
              <ExternalLink className="size-3.5" />
              <span className="sr-only">Open link</span>
            </a>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-2 text-base font-semibold leading-snug tracking-tight text-foreground sm:text-lg">
          {onOpenReader ? (
            <button
              onClick={() => onOpenReader(article)}
              className="text-left hover:text-primary transition-colors hover:underline underline-offset-3 cursor-pointer"
            >
              {article.title}
            </button>
          ) : (
            <a
              href={article.originalUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="hover:text-primary transition-colors hover:underline underline-offset-3"
            >
              {article.title}
            </a>
          )}
        </h3>

        {/* Snippet */}
        {article.description && (
          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground sm:text-sm leading-relaxed">
            {article.description}
          </p>
        )}

        {/* Footer Keyword & Topic Badges */}
        {(article.matchedKeywords?.length || article.topics?.length) ? (
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5 pt-1">
            {article.matchedKeywords?.map((kw) => (
              <Badge
                key={kw}
                variant="secondary"
                className="text-[10px] py-0 px-2 font-medium border border-primary/20 bg-primary/8 text-primary transition-colors hover:bg-primary/15"
              >
                #{kw}
              </Badge>
            ))}
            {article.topics?.map((topic) => (
              <Badge
                key={topic}
                variant="outline"
                className="text-[10px] py-0 px-2 font-normal text-muted-foreground border-border/70"
              >
                {topic}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
