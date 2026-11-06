import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { refreshSource } from "@/server/services/source.service";
import { handleApiError } from "@/server/auth/api-error";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const refreshed = await refreshSource(user.id, id);
    return NextResponse.json({ data: refreshed });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
