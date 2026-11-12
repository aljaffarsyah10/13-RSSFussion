import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { listArticles, listSavedArticles } from "@/server/services/article.service";
import { handleApiError } from "@/server/auth/api-error";
import { Article } from "@/types/models";

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function articlesToCsv(articles: Article[]): string {
  const headers = [
    "ID",
    "Title",
    "Source",
    "Published At",
    "URL",
    "Topics",
    "Keywords",
    "Is Read",
    "Is Saved",
    "Description",
  ];

  const rows = articles.map((a) => [
    escapeCsvField(a.id),
    escapeCsvField(a.title),
    escapeCsvField(a.sourceName),
    escapeCsvField(a.publishedAt),
    escapeCsvField(a.canonicalUrl || a.originalUrl),
    escapeCsvField((a.topics || []).join("; ")),
    escapeCsvField((a.matchedKeywords || []).join("; ")),
    escapeCsvField(a.isRead ? "Yes" : "No"),
    escapeCsvField(a.isSaved ? "Yes" : "No"),
    escapeCsvField(a.description || a.contentSnippet || ""),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

function articlesToMarkdown(articles: Article[]): string {
  const dateStr = new Date().toISOString().split("T")[0];
  const lines: string[] = [
    `# RSSFusion Export (${dateStr})`,
    `Total Articles: ${articles.length}`,
    "",
    "---",
    "",
  ];

  for (const a of articles) {
    const url = a.canonicalUrl || a.originalUrl;
    lines.push(`## [${a.title}](${url})`);
    lines.push(`- **Publication:** ${a.sourceName}`);
    lines.push(`- **Published Date:** ${a.publishedAt}`);
    if (a.author) lines.push(`- **Author:** ${a.author}`);
    if (a.topics?.length) lines.push(`- **Topics:** ${a.topics.join(", ")}`);
    if (a.matchedKeywords?.length) lines.push(`- **Keywords:** ${a.matchedKeywords.map((k) => `#${k}`).join(" ")}`);
    lines.push(`- **Status:** ${a.isSaved ? "Saved (Bookmarked)" : "Feed"} | ${a.isRead ? "Read" : "Unread"}`);
    lines.push("");
    if (a.description) {
      lines.push(`> ${a.description.replace(/\n/g, " ")}`);
      lines.push("");
    }
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);

    const format = (searchParams.get("format") || "json").toLowerCase();
    const savedOnly = searchParams.get("savedOnly") === "true";
    const q = searchParams.get("q") || undefined;
    const sourceId = searchParams.get("sourceId") || undefined;
    const topicId = searchParams.get("topicId") || undefined;
    const readStatus = (searchParams.get("readStatus") as "all" | "unread" | "read") || undefined;
    const timeframe = (searchParams.get("timeframe") as "all" | "today" | "3days" | "7days" | "30days") || undefined;

    let articles: Article[] = [];

    if (savedOnly && !sourceId && !topicId && !q) {
      articles = await listSavedArticles(user.id);
    } else {
      articles = await listArticles(user.id, {
        q,
        sourceId,
        topicId,
        readStatus,
        savedOnly,
        timeframe,
        limit: 100, // Export up to 100 articles at a time
      });
    }

    const todayDate = new Date().toISOString().slice(0, 10);

    if (format === "csv") {
      const csv = articlesToCsv(articles);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="rssfusion-articles-${todayDate}.csv"`,
        },
      });
    }

    if (format === "markdown" || format === "md") {
      const md = articlesToMarkdown(articles);
      return new NextResponse(md, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="rssfusion-articles-${todayDate}.md"`,
        },
      });
    }

    // Default JSON
    return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), count: articles.length, articles }, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="rssfusion-articles-${todayDate}.json"`,
      },
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
