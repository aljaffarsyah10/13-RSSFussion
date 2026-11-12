"use client";

import * as React from "react";
import { Article } from "@/types/models";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ExternalLink,
  Globe,
  Calendar,
  Clock,
  Copy,
  Check,
} from "lucide-react";

interface ArticleReaderDialogProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleSave?: (articleId: string) => void;
  onToggleRead?: (articleId: string) => void;
}

export function ArticleReaderDialog({
  article,
  isOpen,
  onClose,
  onToggleSave,
  onToggleRead,
}: ArticleReaderDialogProps) {
  const [copied, setCopied] = React.useState(false);

  const wordCount = React.useMemo(() => {
    if (!article) return 0;
    const text = (article.contentSnippet || article.description || "") + " " + article.title;
    return text.trim().split(/\s+/).filter(Boolean).length;
  }, [article]);

  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 180));

  const formattedDate = React.useMemo(() => {
    if (!article) return "";
    try {
      const d = new Date(article.publishedAt);
      return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return article.publishedAt;
    }
  }, [article]);

  if (!article) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(article.canonicalUrl || article.originalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto sm:max-w-3xl p-6 sm:p-8">
        <DialogHeader className="space-y-3 pb-4 border-b border-border/60">
          {/* Metadata pill row */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="gap-1.5 font-medium border-border/70 text-foreground">
              <Globe className="size-3 text-muted-foreground" />
              <span>{article.sourceName}</span>
            </Badge>

            <span className="flex items-center gap-1 text-[11px]">
              <Calendar className="size-3 opacity-70" />
              <span>{formattedDate}</span>
            </span>

            <span className="flex items-center gap-1 text-[11px]">
              <Clock className="size-3 opacity-70" />
              <span>{readingTimeMin} min read ({wordCount} words)</span>
            </span>

            {article.author && (
              <span className="text-[11px] text-muted-foreground">
                by <strong className="text-foreground font-medium">{article.author}</strong>
              </span>
            )}
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-foreground leading-snug">
            {article.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Reader view for article: {article.title}
          </DialogDescription>
        </DialogHeader>

        {/* Content Body */}
        <div className="py-6 space-y-4">
          {article.imageUrl && (
            <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20 max-h-72 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-auto object-cover max-h-72"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          )}

          <div className="text-sm sm:text-base leading-relaxed text-foreground/90 font-serif sm:font-sans space-y-4">
            {article.description && (
              <p className="leading-relaxed whitespace-pre-line text-foreground/90">
                {article.description}
              </p>
            )}

            {article.contentSnippet && article.contentSnippet !== article.description && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {article.contentSnippet}
              </div>
            )}
          </div>

          {/* Topics and matched keywords */}
          <div className="pt-4 flex flex-wrap items-center gap-1.5 border-t border-border/40">
            {article.topics?.map((topic) => (
              <Badge key={topic} variant="outline" className="text-xs">
                {topic}
              </Badge>
            ))}
            {article.matchedKeywords?.map((kw) => (
              <Badge key={kw} variant="secondary" className="text-xs text-primary bg-primary/10 border-primary/20">
                #{kw}
              </Badge>
            ))}
          </div>
        </div>

        {/* Action Footer */}
        <DialogFooter className="flex-row items-center justify-between sm:justify-between border-t border-border/60 pt-4 gap-2">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-8 gap-1.5 text-xs cursor-pointer"
            >
              {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              <span>{copied ? "Link Copied" : "Copy Link"}</span>
            </Button>

            {onToggleSave && (
              <Button
                variant={article.isSaved ? "secondary" : "outline"}
                size="sm"
                onClick={() => onToggleSave(article.id)}
                className="h-8 gap-1.5 text-xs cursor-pointer"
              >
                {article.isSaved ? (
                  <>
                    <BookmarkCheck className="size-3.5 fill-amber-500 text-amber-500" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="size-3.5" />
                    <span>Save</span>
                  </>
                )}
              </Button>
            )}

            {onToggleRead && (
              <Button
                variant={article.isRead ? "secondary" : "outline"}
                size="sm"
                onClick={() => onToggleRead(article.id)}
                className="h-8 gap-1.5 text-xs cursor-pointer"
              >
                <CheckCircle2
                  className={article.isRead ? "size-3.5 text-emerald-500" : "size-3.5 text-muted-foreground"}
                />
                <span>{article.isRead ? "Read" : "Mark as Read"}</span>
              </Button>
            )}
          </div>

          <a
            href={article.originalUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={buttonVariants({
              variant: "default",
              size: "sm",
              className: "h-8 gap-1.5 text-xs shadow-xs cursor-pointer",
            })}
          >
            <span>Open Publication</span>
            <ExternalLink className="size-3" />
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
