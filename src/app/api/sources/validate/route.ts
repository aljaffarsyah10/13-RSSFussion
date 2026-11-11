import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { validateFeedUrl } from "@/lib/rss/ssrf-validator";
import { fetchAndParseFeed } from "@/lib/rss/feed-parser";
import { handleApiError } from "@/server/auth/api-error";

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = await request.json();
    const feedUrl = body.feedUrl;

    if (!feedUrl || typeof feedUrl !== "string") {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "feedUrl is required" } },
        { status: 400 }
      );
    }

    const ssrf = await validateFeedUrl(feedUrl);
    if (!ssrf.valid) {
      return NextResponse.json(
        { error: { code: "SSRF_BLOCKED", message: ssrf.reason } },
        { status: 422 }
      );
    }

    const parsed = await fetchAndParseFeed(feedUrl, "preview");

    return NextResponse.json({
      data: {
        valid: true,
        title: parsed.title,
        description: parsed.description,
        siteUrl: parsed.siteUrl,
        itemCount: parsed.items.length,
        itemsCount: parsed.items.length,
        recentItems: parsed.items.slice(0, 3).map((item) => ({
          title: item.title,
          publishedAt: item.publishedAt,
          url: item.canonicalUrl,
        })),
      },
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
