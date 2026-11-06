export interface OpmlFeedItem {
  title: string;
  xmlUrl: string;
  htmlUrl?: string;
  description?: string;
  category?: string;
}

export interface OpmlParseResult {
  title?: string;
  feeds: OpmlFeedItem[];
}

/**
 * Parses OPML XML string and extracts all RSS/Atom outline feeds.
 */
export function parseOpml(xmlContent: string): OpmlParseResult {
  const feeds: OpmlFeedItem[] = [];

  // Match title in head
  const titleMatch = xmlContent.match(/<head>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<\/head>/i);
  const title = titleMatch ? titleMatch[1].trim() : undefined;

  // Match all <outline ... /> or <outline ...> tags
  const outlineRegex = /<outline\b([^>]+?)(?:\/?>|>[\s\S]*?<\/outline>)/gi;
  let match: RegExpExecArray | null;

  while ((match = outlineRegex.exec(xmlContent)) !== null) {
    const attrString = match[1];

    // Helper to extract attribute values
    const getAttr = (name: string): string | undefined => {
      const reg = new RegExp(`\\b${name}=["']([^"']*)["']`, "i");
      const m = attrString.match(reg);
      return m ? m[1].trim() : undefined;
    };

    const xmlUrl = getAttr("xmlUrl") || getAttr("xmlurl") || getAttr("url");
    if (!xmlUrl || !xmlUrl.startsWith("http")) {
      continue;
    }

    const feedTitle =
      getAttr("text") ||
      getAttr("title") ||
      getAttr("description") ||
      new URL(xmlUrl).hostname;

    const htmlUrl = getAttr("htmlUrl") || getAttr("htmlurl");
    const description = getAttr("description");
    const category = getAttr("category");

    // Avoid duplicate xmlUrls within the same file
    if (!feeds.some((f) => f.xmlUrl.toLowerCase() === xmlUrl.toLowerCase())) {
      feeds.push({
        title: feedTitle,
        xmlUrl,
        htmlUrl,
        description,
        category,
      });
    }
  }

  return { title, feeds };
}

/**
 * Escapes special XML characters in string.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generates a valid OPML 2.0 XML string from a list of feeds.
 */
export function generateOpml(
  feeds: Array<{ name: string; feedUrl: string; siteUrl?: string; description?: string }>,
  title = "RSSFusion Feeds Export"
): string {
  const dateStr = new Date().toUTCString();

  const outlines = feeds
    .map((feed) => {
      const name = escapeXml(feed.name || "RSS Feed");
      const xmlUrl = escapeXml(feed.feedUrl);
      const htmlUrl = feed.siteUrl ? ` htmlUrl="${escapeXml(feed.siteUrl)}"` : "";
      const desc = feed.description ? ` description="${escapeXml(feed.description)}"` : "";
      return `    <outline text="${name}" title="${name}" type="rss" xmlUrl="${xmlUrl}"${htmlUrl}${desc}/>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${escapeXml(title)}</title>
    <dateCreated>${dateStr}</dateCreated>
    <docs>http://opml.org/spec2.opml</docs>
  </head>
  <body>
${outlines}
  </body>
</opml>`;
}
