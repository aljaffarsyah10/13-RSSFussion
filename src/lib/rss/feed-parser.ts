import Parser from "rss-parser";
import { safeFetchWithRedirects, validateFeedUrl } from "./ssrf-validator";
import {
  canonicalizeUrl,
  stripHtml,
  generateFallbackGuid,
  extractImageUrl,
} from "./article-normalizer";

const DEFAULT_USER_AGENT = "RSSFusionBot/1.0 (+https://github.com/rssfusion/rssfusion)";
const DEFAULT_ACCEPT_HEADER =
  "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": DEFAULT_USER_AGENT,
    Accept: DEFAULT_ACCEPT_HEADER,
  },
});

export interface ParsedFeedItem {
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

export interface ParseFeedResult {
  title: string;
  description?: string;
  siteUrl?: string;
  items: ParsedFeedItem[];
  httpStatus: number;
  etag?: string;
  lastModified?: string;
  notModified?: boolean;
  discoveredFeedUrl?: string;
}

export function discoverFeedUrlFromHtml(html: string, baseUrl: string): string | null {
  const match = html.match(/<link[^>]+type=["']application\/(?:rss\+xml|atom\+xml)["'][^>]*>/i);
  if (match) {
    const linkTag = match[0];
    const hrefMatch = linkTag.match(/href=["']([^"']+)["']/i);
    if (hrefMatch && hrefMatch[1]) {
      try {
        return new URL(hrefMatch[1].trim(), baseUrl).toString();
      } catch {
        // continue
      }
    }
  }

  const invertedMatch = html.match(/<link[^>]+href=["']([^"']+)["'][^>]+type=["']application\/(?:rss\+xml|atom\+xml)["']/i);
  if (invertedMatch && invertedMatch[1]) {
    try {
      return new URL(invertedMatch[1].trim(), baseUrl).toString();
    } catch {
      // continue
    }
  }

  return null;
}

export async function fetchAndParseFeed(
  feedUrl: string,
  sourceId: string,
  options?: {
    etag?: string;
    lastModified?: string;
  }
): Promise<ParseFeedResult> {
  const headers: Record<string, string> = {
    "User-Agent": DEFAULT_USER_AGENT,
    Accept: DEFAULT_ACCEPT_HEADER,
  };

  if (options?.etag) {
    headers["If-None-Match"] = options.etag;
  }
  if (options?.lastModified) {
    headers["If-Modified-Since"] = options.lastModified;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

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

  // Handle 304 Not Modified
  if (response.status === 304) {
    return {
      title: "",
      items: [],
      httpStatus: 304,
      notModified: true,
      etag: options?.etag,
      lastModified: options?.lastModified,
    };
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}: Failed to fetch feed (Status ${response.status})`);
  }

  const newEtag = response.headers.get("etag") || undefined;
  const newLastModified = response.headers.get("last-modified") || undefined;

  // Max 5MB body size protection
  const xmlText = await response.text();
  if (xmlText.length > 5 * 1024 * 1024) {
    throw new Error("FEED_TOO_LARGE: Feed body exceeded 5MB limit");
  }

  // Parse RSS / Atom XML
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let feed: any;

  try {
    feed = await parser.parseString(xmlText);
  } catch (parseErr: unknown) {
    // If parsing fails, check if the response was an HTML page with auto-discoverable RSS/Atom links
    const discovered = discoverFeedUrlFromHtml(xmlText, feedUrl);
    if (discovered && discovered !== feedUrl) {
      const ssrfCheck = await validateFeedUrl(discovered);
      if (ssrfCheck.valid) {
        const subResult = await fetchAndParseFeed(discovered, sourceId, options);
        return {
          ...subResult,
          discoveredFeedUrl: discovered,
        };
      }
    }
    throw parseErr;
  }

  // Normalize items
  const nowIso = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizedItems: ParsedFeedItem[] = (feed.items || []).slice(0, 100).map((item: any) => {
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
    const enclosureUrl = item.enclosure?.url;
    const imageUrl = extractImageUrl(rawContent, enclosureUrl);
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
    title: feed.title || "Untitled Feed",
    description: feed.description,
    siteUrl: feed.link,
    items: normalizedItems,
    httpStatus: response.status,
    etag: newEtag,
    lastModified: newLastModified,
  };
}
