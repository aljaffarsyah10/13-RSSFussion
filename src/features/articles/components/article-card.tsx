"use client";

import * as React from "react";
import { Article } from "@/types/models";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Bookmark, BookmarkCheck, ExternalLink, Globe, CheckCircle2 } from "lucide-react";
import { cn } from "cn";

interface ArticleCardProps {
  article: Article;
  onToggleSave?: (articleId: string) => void;
  onToggleRead?: (articleId: string) => void;
  className?: string;
}

export function ArticleCard({
  article,
  onToggleSave,
  onToggleRead,
  className,
}: ArticleCardProps) {
  // Format relative or readable date
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

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border border-border bg-card transition-all hover:border-foreground/20 hover:shadow-xs",
        article.isRead && "opacity-75 bg-muted/20",
        className
      )}
    >
      <CardContent className="p-4 sm:p-5">
        {/* Header Metadata */}
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Globe className="size-3 text-muted-foreground" />
              {article.sourceName}
            </span>
            <span>•</span>
            <time dateTime={article.publishedAt}>{formattedDate}</time>
            {article.author && (
              <>
                <span>•</span>
                <span className="truncate max-w-[140px]">by {article.author}</span>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {onToggleRead && (
              <Button
                variant="ghost"
                size="icon-xs"
                title={article.isRead ? "Mark as unread" : "Mark as read"}
                onClick={() => onToggleRead(article.id)}
                className={cn(
                  "size-7 text-muted-foreground hover:text-foreground",
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
                  "size-7 text-muted-foreground hover:text-foreground",
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
                className: "size-7 text-muted-foreground hover:text-foreground",
              })}
            >
              <ExternalLink className="size-3.5" />
              <span className="sr-only">Open link</span>
            </a>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-2 text-base font-semibold leading-snug tracking-tight text-foreground sm:text-lg">
          <a
            href={article.originalUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="hover:underline underline-offset-2"
          >
            {article.title}
          </a>
        </h3>

        {/* Snippet */}
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground sm:text-sm leading-relaxed">
          {article.description}
        </p>

        {/* Footer Keyword & Topic Badges */}
        {(article.matchedKeywords?.length || article.topics?.length) ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-1">
            {article.matchedKeywords?.map((kw) => (
              <Badge
                key={kw}
                variant="secondary"
                className="text-[10px] py-0 px-2 font-normal border border-primary/20 bg-primary/5 text-primary"
              >
                #{kw}
              </Badge>
            ))}
            {article.topics?.map((topic) => (
              <Badge
                key={topic}
                variant="outline"
                className="text-[10px] py-0 px-2 font-normal text-muted-foreground"
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
