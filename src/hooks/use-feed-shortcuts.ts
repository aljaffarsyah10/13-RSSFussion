"use client";

import * as React from "react";
import { Article } from "@/types/models";

interface UseFeedShortcutsProps {
  articles: Article[];
  focusedIndex: number;
  setFocusedIndex: React.Dispatch<React.SetStateAction<number>>;
  onOpenReader?: (article: Article) => void;
  onToggleSave?: (articleId: string) => void;
  onToggleRead?: (articleId: string) => void;
  onToggleSelect?: (articleId: string) => void;
  onFocusSearch?: () => void;
  onOpenHelp?: () => void;
  enabled?: boolean;
}

export function useFeedShortcuts({
  articles,
  focusedIndex,
  setFocusedIndex,
  onOpenReader,
  onToggleSave,
  onToggleRead,
  onToggleSelect,
  onFocusSearch,
  onOpenHelp,
  enabled = true,
}: UseFeedShortcutsProps) {
  React.useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Do not trigger shortcuts when typing inside form inputs
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        if (e.key === "Escape") {
          target.blur();
        }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const currentArticle = articles[focusedIndex];

      switch (e.key) {
        case "j":
        case "ArrowDown": {
          e.preventDefault();
          setFocusedIndex((prev) => (prev < articles.length - 1 ? prev + 1 : prev));
          break;
        }

        case "k":
        case "ArrowUp": {
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        }

        case "o":
        case "Enter": {
          if (currentArticle && onOpenReader) {
            e.preventDefault();
            onOpenReader(currentArticle);
          }
          break;
        }

        case "v": {
          if (currentArticle) {
            e.preventDefault();
            window.open(currentArticle.originalUrl, "_blank", "noopener,noreferrer");
          }
          break;
        }

        case "m": {
          if (currentArticle && onToggleRead) {
            e.preventDefault();
            onToggleRead(currentArticle.id);
          }
          break;
        }

        case "s": {
          if (currentArticle && onToggleSave) {
            e.preventDefault();
            onToggleSave(currentArticle.id);
          }
          break;
        }

        case "x": {
          if (currentArticle && onToggleSelect) {
            e.preventDefault();
            onToggleSelect(currentArticle.id);
          }
          break;
        }

        case "/": {
          if (onFocusSearch) {
            e.preventDefault();
            onFocusSearch();
          }
          break;
        }

        case "?": {
          if (onOpenHelp) {
            e.preventDefault();
            onOpenHelp();
          }
          break;
        }

        default:
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    articles,
    focusedIndex,
    setFocusedIndex,
    onOpenReader,
    onToggleSave,
    onToggleRead,
    onToggleSelect,
    onFocusSearch,
    onOpenHelp,
    enabled,
  ]);
}
