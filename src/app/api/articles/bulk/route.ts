import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import {
  bulkMarkArticlesRead,
  bulkSaveArticles,
  markAllArticlesRead,
} from "@/server/services/article.service";
import { handleApiError } from "@/server/auth/api-error";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));

    const { action, articleIds, sourceId, topicId } = body;

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        { error: { message: "Action is required", code: "BAD_REQUEST" } },
        { status: 400 }
      );
    }

    if (action === "markAllRead") {
      const res = await markAllArticlesRead(user.id, {
        sourceId: typeof sourceId === "string" ? sourceId : undefined,
        topicId: typeof topicId === "string" ? topicId : undefined,
      });
      return NextResponse.json({ success: true, affectedCount: res.markedCount });
    }

    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json(
        { error: { message: "articleIds array is required and cannot be empty", code: "BAD_REQUEST" } },
        { status: 400 }
      );
    }

    // Limit bulk operations to 100 items per request
    const safeIds = articleIds.slice(0, 100).filter((id): id is string => typeof id === "string" && Boolean(id));

    if (action === "markRead") {
      const res = await bulkMarkArticlesRead(user.id, safeIds, true);
      return NextResponse.json({ success: true, affectedCount: res.affectedCount });
    }

    if (action === "markUnread") {
      const res = await bulkMarkArticlesRead(user.id, safeIds, false);
      return NextResponse.json({ success: true, affectedCount: res.affectedCount });
    }

    if (action === "save") {
      const res = await bulkSaveArticles(user.id, safeIds, true);
      return NextResponse.json({ success: true, affectedCount: res.affectedCount });
    }

    if (action === "unsave") {
      const res = await bulkSaveArticles(user.id, safeIds, false);
      return NextResponse.json({ success: true, affectedCount: res.affectedCount });
    }

    return NextResponse.json(
      { error: { message: `Unsupported bulk action: ${action}`, code: "BAD_REQUEST" } },
      { status: 400 }
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
