import Parser from "rss-parser";
import { validateFeedUrl } from "./ssrf-validator.js";
import {
  canonicalizeUrl,
  stripHtml,
  generateFallbackGuid,
  extractImageUrl,
} from "./article-normalizer.js";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "RSSFusionBot/1.0 (+https://github.com/rssfusion/rssfusion)",
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
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
  const ssrf = await validateFeedUrl(feedUrl);
  if (!ssrf.valid) {
    throw new Error(`SSRF_BLOCKED: ${ssrf.reason}`);
  }

  const headers: Record<string, string> = {
    "User-Agent": "RSSFusionBot/1.0 (+https://github.com/rssfusion/rssfusion)",
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
  };
  if (options?.etag) headers["If-None-Match"] = options.etag;
  if (options?.lastModified) headers["If-Modified-Since"] = options.lastModified;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  let response: Response;
  try {
    response = await fetch(feedUrl, {
      method: "GET",
      headers,
      signal: controller.signal,
      redirect: "follow",
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
    const originalLink = item.link || item.guid || feedUrl;
    const canonicalLink = canonicalizeUrl(originalLink);
    const cleanTitle = stripHtml(item.title || "Untitled Article");
    const rawContent = item["content:encoded"] || item.content || item.summary || "";
    const cleanDescription = stripHtml(item.contentSnippet || item.summary || rawContent).slice(0, 1000);
    const snippet = cleanDescription.slice(0, 300);

    let pubDateIso = nowIso;
    if (item.isoDate) {
      pubDateIso = item.isoDate;
    } else if (item.pubDate) {
      try {
        pubDateIso = new Date(item.pubDate).toISOString();
      } catch {
        pubDateIso = nowIso;
      }
    }

    const guid = item.id || item.guid || generateFallbackGuid(sourceId, canonicalLink, cleanTitle, pubDateIso);
    const imageUrl = extractImageUrl(rawContent, item.enclosure?.url);

    return {
      guid,
      canonicalUrl: canonicalLink,
      originalUrl: originalLink,
      title: cleanTitle,
      description: cleanDescription,
      contentSnippet: snippet,
      author: item.creator || item.author || undefined,
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
