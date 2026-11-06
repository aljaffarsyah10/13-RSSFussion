import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { listArticles } from "@/server/services/article.service";
import { handleApiError } from "@/server/auth/api-error";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q") || undefined;
    const sourceId = searchParams.get("sourceId") || undefined;
    const topicId = searchParams.get("topicId") || undefined;
    const readStatus = (searchParams.get("readStatus") as "all" | "unread" | "read") || undefined;
    const cursor = searchParams.get("cursor") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;

    const articles = await listArticles(user.id, {
      q,
      sourceId,
      topicId,
      readStatus,
      cursor,
      limit,
    });

    return NextResponse.json({
      data: articles,
      nextCursor: articles.length === limit ? articles[articles.length - 1].publishedAt : null,
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
