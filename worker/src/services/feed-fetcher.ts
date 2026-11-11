import Parser from "rss-parser";
import { env } from "../config/env.js";
import { safeFetchWithRedirects } from "./ssrf-validator.js";
import {
  canonicalizeUrl,
  stripHtml,
  generateFallbackGuid,
  extractImageUrl,
} from "./article-normalizer.js";

const DEFAULT_ACCEPT_HEADER =
  "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8";

const parser = new Parser({
  timeout: env.WORKER_FETCH_TIMEOUT_MS,
  headers: {
    "User-Agent": env.WORKER_USER_AGENT,
    Accept: DEFAULT_ACCEPT_HEADER,
  },
});

export interface NormalizedArticleItem {
  guid?: string;
  canonicalUrl: string;
  originalUrl: string;
  title: string;
  description: string;
  contentSnippet?: string;
  author?: string;
  imageUrl?: string;
  publishedAt: string;
}

export interface FetchResult {
  items: NormalizedArticleItem[];
  httpStatus: number;
  etag?: string;
  lastModified?: string;
  notModified?: boolean;
}

export async function fetchFeed(
  feedUrl: string,
  sourceId: string,
  options?: { etag?: string; lastModified?: string }
): Promise<FetchResult> {
  const headers: Record<string, string> = {
    "User-Agent": env.WORKER_USER_AGENT,
    Accept: DEFAULT_ACCEPT_HEADER,
  };
  if (options?.etag) headers["If-None-Match"] = options.etag;
  if (options?.lastModified) headers["If-Modified-Since"] = options.lastModified;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.WORKER_FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await safeFetchWithRedirects(feedUrl, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 304) {
    return {
      items: [],
      httpStatus: 304,
      notModified: true,
      etag: options?.etag,
      lastModified: options?.lastModified,
    };
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  const newEtag = response.headers.get("etag") || undefined;
  const newLastModified = response.headers.get("last-modified") || undefined;

  const xmlText = await response.text();
  if (xmlText.length > 5 * 1024 * 1024) {
    throw new Error("FEED_TOO_LARGE: >5MB");
  }

  const feed = await parser.parseString(xmlText);
  const nowIso = new Date().toISOString();

  const items: NormalizedArticleItem[] = (feed.items || []).slice(0, 100).map((item) => {
    const rawItem = item as Record<string, unknown>;
    const originalLink = item.link || item.guid || feedUrl;
    const canonicalLink = canonicalizeUrl(originalLink);
    const cleanTitle = stripHtml(item.title || "Untitled Article");
    const rawContent =
      (typeof rawItem["content:encoded"] === "string" ? rawItem["content:encoded"] : "") ||
      item.content ||
      item.summary ||
      "";
    const cleanDescription = stripHtml(item.contentSnippet || item.summary || rawContent).slice(
      0,
      1000
    );
    const snippet = cleanDescription.slice(0, 300);

    let pubDateIso = nowIso;
    if (item.isoDate) {
      pubDateIso = item.isoDate;
    } else if (item.pubDate) {
      const parsedDate = new Date(item.pubDate);
      if (!Number.isNaN(parsedDate.getTime())) {
        pubDateIso = parsedDate.toISOString();
      }
    }

    const rawId = typeof rawItem.id === "string" ? rawItem.id : undefined;
    const guid =
      rawId ||
      item.guid ||
      generateFallbackGuid(sourceId, canonicalLink, cleanTitle, pubDateIso);
    const imageUrl = extractImageUrl(rawContent, item.enclosure?.url);
    const rawAuthor = typeof rawItem.author === "string" ? rawItem.author : undefined;

    return {
      guid,
      canonicalUrl: canonicalLink,
      originalUrl: originalLink,
      title: cleanTitle,
      description: cleanDescription,
      contentSnippet: snippet,
      author: item.creator || rawAuthor || undefined,
      imageUrl,
      publishedAt: pubDateIso,
    };
  });

  return {
    items,
    httpStatus: response.status,
    etag: newEtag,
    lastModified: newLastModified,
  };
}
