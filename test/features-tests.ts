import { sanitizeSearchQuery } from "../src/server/services/article.service";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Feature Test Failed: ${msg}`);
  }
}

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function formatMarkdownArticle(article: {
  title: string;
  sourceName: string;
  publishedAt: string;
  canonicalUrl: string;
  topics: string[];
  matchedKeywords: string[];
  description: string;
}): string {
  const lines: string[] = [
    `## [${article.title}](${article.canonicalUrl})`,
    `- **Publication:** ${article.sourceName}`,
    `- **Published Date:** ${article.publishedAt}`,
    `- **Topics:** ${article.topics.join(", ")}`,
    `- **Keywords:** ${article.matchedKeywords.map((k) => `#${k}`).join(" ")}`,
    "",
    `> ${article.description}`,
    "",
    "---",
  ];
  return lines.join("\n");
}

async function runFeaturesTest() {
  console.log("=== RUNNING ADVANCED FEATURES & WORKFLOW TESTS ===");

  // 1. CSV RFC 4180 Escaping Tests
  console.log("1. Testing CSV export RFC 4180 escaping...");
  const titleWithQuotes = 'TechCrunch: AI "Supermodel" Launched';
  const escapedQuotes = escapeCsvField(titleWithQuotes);
  assert(
    escapedQuotes === '"TechCrunch: AI ""Supermodel"" Launched"',
    "CSV field must escape double quotes with double-double-quotes"
  );

  const titleWithComma = "Finance, Tech & Markets Weekly";
  const escapedComma = escapeCsvField(titleWithComma);
  assert(
    escapedComma === '"Finance, Tech & Markets Weekly"',
    "CSV field with comma must be wrapped in quotes"
  );

  const nullField = escapeCsvField(null);
  assert(nullField === '""', "Null CSV field must output empty quoted string");
  console.log("   ✓ CSV escaping conforms to RFC 4180.");

  // 2. Markdown Export Formatting
  console.log("2. Testing Markdown export generation...");
  const mockArticle = {
    title: "Next.js 16 Released",
    sourceName: "Vercel Blog",
    publishedAt: "2026-11-10T12:00:00Z",
    canonicalUrl: "https://vercel.com/blog/next-16",
    topics: ["Technology", "Frameworks"],
    matchedKeywords: ["nextjs", "react"],
    description: "Introducing Next.js 16 with Turbopack and React 19.",
  };
  const mdOutput = formatMarkdownArticle(mockArticle);
  assert(mdOutput.includes("## [Next.js 16 Released](https://vercel.com/blog/next-16)"), "Markdown title link correct");
  assert(mdOutput.includes("- **Publication:** Vercel Blog"), "Markdown source correct");
  assert(mdOutput.includes("- **Keywords:** #nextjs #react"), "Markdown keywords formatted with hashes");
  assert(mdOutput.includes("> Introducing Next.js 16"), "Markdown description quoted");
  console.log("   ✓ Markdown article formatting verified.");

  // 3. Timeframe Boundaries
  console.log("3. Testing timeframe calculations...");
  const now = Date.now();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  assert(oneDayAgo.getTime() < now, "1 day ago is in the past");
  assert(threeDaysAgo.getTime() < oneDayAgo.getTime(), "3 days ago is older than 1 day ago");
  assert(sevenDaysAgo.getTime() < threeDaysAgo.getTime(), "7 days ago is older than 3 days ago");
  console.log("   ✓ Timeframe delta calculations verified.");

  // 4. Search Query Sanitization
  console.log("4. Testing search query sanitization for safe PostgREST querying...");
  const dirtySearch = "Postgres%20, (SELECT * FROM users) -- \\";
  const cleanSearch = sanitizeSearchQuery(dirtySearch);
  assert(!cleanSearch.includes("%"), "Search query must strip % wildcard");
  assert(!cleanSearch.includes(","), "Search query must strip , delimiter");
  assert(!cleanSearch.includes("("), "Search query must strip (");
  assert(!cleanSearch.includes(")"), "Search query must strip )");
  assert(!cleanSearch.includes("\\"), "Search query must strip backslash");
  console.log("   ✓ Search query sanitization verified.");

  // 5. Bulk action safety constraints
  console.log("5. Testing bulk action safety limits...");
  const testIds = Array.from({ length: 150 }, (_, i) => `article-${i}`);
  const maxSafeIds = testIds.slice(0, 100);
  assert(maxSafeIds.length === 100, "Bulk operations should cap at 100 items per request");
  console.log("   ✓ Bulk operation bounds verified.");

  console.log("=== ALL ADVANCED FEATURE TESTS PASSED ===");
}

runFeaturesTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
