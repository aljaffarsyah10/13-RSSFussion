import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { updateTopic, deleteTopic } from "@/server/services/topic.service";
import { handleApiError } from "@/server/auth/api-error";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const updated = await updateTopic(user.id, id, body);
    return NextResponse.json({ data: updated });
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
    await deleteTopic(user.id, id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
