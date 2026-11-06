import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { getSource, updateSource, deleteSource } from "@/server/services/source.service";
import { handleApiError } from "@/server/auth/api-error";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const source = await getSource(user.id, id);
    return NextResponse.json({ data: source });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const updated = await updateSource(user.id, id, body);
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
    await deleteSource(user.id, id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
