import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { listSavedArticles, saveArticle } from "@/server/services/article.service";
import { handleApiError } from "@/server/auth/api-error";

export async function GET() {
  try {
    const user = await requireUser();
    const saved = await listSavedArticles(user.id);
    return NextResponse.json({ data: saved });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const articleId = body.articleId;

    if (!articleId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "articleId is required" } },
        { status: 400 }
      );
    }

    const saved = await saveArticle(user.id, articleId);
    return NextResponse.json({ data: saved }, { status: 201 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
