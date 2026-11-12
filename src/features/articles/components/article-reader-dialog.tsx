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
  Share2,
  FileText,
  Quote,
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
  const [copiedType, setCopiedType] = React.useState<"link" | "markdown" | "citation" | null>(null);
  const [fontSize, setFontSize] = React.useState<"sm" | "base" | "lg">("base");

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

  const pubYear = React.useMemo(() => {
    if (!article) return new Date().getFullYear();
    try {
      return new Date(article.publishedAt).getFullYear();
    } catch {
      return new Date().getFullYear();
    }
  }, [article]);

  if (!article) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(article.canonicalUrl || article.originalUrl);
      setCopiedType("link");
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyMarkdown = async () => {
    const md = `[${article.title}](${article.canonicalUrl || article.originalUrl}) - *${article.sourceName}*`;
    try {
      await navigator.clipboard.writeText(md);
      setCopiedType("markdown");
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyCitation = async () => {
    const authorStr = article.author || article.sourceName;
    const citation = `${authorStr} (${pubYear}). "${article.title}". ${article.sourceName}. Available at: ${article.canonicalUrl || article.originalUrl}`;
    try {
      await navigator.clipboard.writeText(citation);
      setCopiedType("citation");
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: article.canonicalUrl || article.originalUrl,
        });
        return;
      } catch {
        // Fallback to copy link
      }
    }
    handleCopyLink();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto sm:max-w-3xl p-6 sm:p-8">
        <DialogHeader className="space-y-3 pb-4 border-b border-border/60">
          {/* Metadata pill row */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
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

            {/* Typography Font Size Adjuster */}
            <div className="flex items-center gap-1 border border-border/70 rounded-lg p-0.5 bg-muted/40">
              <button
                onClick={() => setFontSize("sm")}
                className={`px-1.5 py-0.5 text-[10px] rounded font-medium cursor-pointer ${fontSize === "sm" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"}`}
                title="Small text"
              >
                A-
              </button>
              <button
                onClick={() => setFontSize("base")}
                className={`px-1.5 py-0.5 text-xs rounded font-medium cursor-pointer ${fontSize === "base" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"}`}
                title="Default text"
              >
                A
              </button>
              <button
                onClick={() => setFontSize("lg")}
                className={`px-1.5 py-0.5 text-xs rounded font-semibold cursor-pointer ${fontSize === "lg" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"}`}
                title="Large text"
              >
                A+
              </button>
            </div>
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

          <div
            className={`leading-relaxed text-foreground/90 font-serif sm:font-sans space-y-4 ${
              fontSize === "sm" ? "text-xs sm:text-sm" : fontSize === "lg" ? "text-base sm:text-lg" : "text-sm sm:text-base"
            }`}
          >
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
        <DialogFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-between border-t border-border/60 pt-4 gap-2">
          {/* Smart Citation & Sharing Bar */}
          <div className="flex items-center gap-1 flex-wrap">
            <Button
              variant="outline"
              size="xs"
              onClick={handleCopyLink}
              className="h-7 text-xs gap-1 cursor-pointer"
              title="Copy URL"
            >
              {copiedType === "link" ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              <span>{copiedType === "link" ? "Copied" : "Link"}</span>
            </Button>

            <Button
              variant="outline"
              size="xs"
              onClick={handleCopyMarkdown}
              className="h-7 text-xs gap-1 cursor-pointer"
              title="Copy Markdown link [Title](URL)"
            >
              {copiedType === "markdown" ? <Check className="size-3 text-emerald-500" /> : <FileText className="size-3" />}
              <span>{copiedType === "markdown" ? "MD Copied" : "Markdown"}</span>
            </Button>

            <Button
              variant="outline"
              size="xs"
              onClick={handleCopyCitation}
              className="h-7 text-xs gap-1 cursor-pointer"
              title="Copy academic/research citation"
            >
              {copiedType === "citation" ? <Check className="size-3 text-emerald-500" /> : <Quote className="size-3" />}
              <span>{copiedType === "citation" ? "Cited" : "Citation"}</span>
            </Button>

            <Button
              variant="outline"
              size="xs"
              onClick={handleShare}
              className="h-7 text-xs gap-1 cursor-pointer"
              title="Share article"
            >
              <Share2 className="size-3" />
              <span>Share</span>
            </Button>
          </div>

          {/* Core Actions */}
          <div className="flex items-center gap-1.5 ml-auto">
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
              <span>Original</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
