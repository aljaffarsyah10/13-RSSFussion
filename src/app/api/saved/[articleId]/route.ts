import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { unsaveArticle } from "@/server/services/article.service";
import { handleApiError } from "@/server/auth/api-error";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ articleId: string }> }
) {
  try {
    const user = await requireUser();
    const { articleId } = await params;
    await unsaveArticle(user.id, articleId);
    return NextResponse.json({ data: { success: true }, success: true });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
