import * as crypto from "crypto";

export function canonicalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();

    if (
      (url.protocol === "http:" && url.port === "80") ||
      (url.protocol === "https:" && url.port === "443")
    ) {
      url.port = "";
    }

    const paramsToDelete: string[] = [];
    url.searchParams.forEach((_, key) => {
      const lower = key.toLowerCase();
      if (
        lower.startsWith("utm_") ||
        lower === "fbclid" ||
        lower === "gclid" ||
        lower === "mc_cid" ||
        lower === "mc_eid" ||
        lower === "ref" ||
        lower === "source"
      ) {
        paramsToDelete.push(key);
      }
    });
    paramsToDelete.forEach((key) => url.searchParams.delete(key));

    url.hash = "";

    let result = url.toString();
    if (result.endsWith("/") && url.pathname !== "/") {
      result = result.slice(0, -1);
    }

    return result;
  } catch {
    return rawUrl.trim();
  }
}

export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function generateFallbackGuid(
  sourceId: string,
  canonicalUrl: string,
  title: string,
  publishedAt: string
): string {
  const payload = `${sourceId}|${canonicalUrl}|${title}|${publishedAt}`;
  const hash = crypto.createHash("sha256").update(payload).digest("hex");
  return `sha256:${hash.slice(0, 32)}`;
}

export function extractImageUrl(rawContent?: string, enclosureUrl?: string): string | undefined {
  if (enclosureUrl && (enclosureUrl.startsWith("http://") || enclosureUrl.startsWith("https://"))) {
    return enclosureUrl;
  }

  if (rawContent) {
    const match = rawContent.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
    if (match && match[1]) {
      return match[1];
    }
  }

  return undefined;
}
