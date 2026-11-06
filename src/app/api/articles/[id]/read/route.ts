import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { markArticleRead } from "@/server/services/article.service";
import { handleApiError } from "@/server/auth/api-error";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const result = await markArticleRead(user.id, id);
    return NextResponse.json({ data: result });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
