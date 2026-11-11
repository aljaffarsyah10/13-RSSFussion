import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { getSource, updateSource, deleteSource } from "@/server/services/source.service";
import { sourceUpdateSchema } from "@/lib/validation/schemas";
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

    const parsed = sourceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid source update data",
            details: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const updated = await updateSource(user.id, id, parsed.data);
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
    return NextResponse.json({ data: { success: true }, success: true });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
