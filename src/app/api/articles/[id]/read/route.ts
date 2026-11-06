import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { markArticleRead } from "@/server/services/article.service";
import { handleApiError } from "@/server/auth/api-error";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    let isRead = true;
    try {
      const body = await request.json();
      if (typeof body?.isRead === "boolean") {
        isRead = body.isRead;
      }
    } catch {
      // Body empty or not JSON, default isRead = true
    }
    const result = await markArticleRead(user.id, id, isRead);
    return NextResponse.json({ data: result });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const result = await markArticleRead(user.id, id, false);
    return NextResponse.json({ data: result });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
