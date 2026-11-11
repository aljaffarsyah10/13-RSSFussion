import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { updateKeyword, deleteKeyword } from "@/server/services/keyword.service";
import { keywordUpdateSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/server/auth/api-error";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();

    const parsed = keywordUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid keyword update data",
            details: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const updated = await updateKeyword(user.id, id, parsed.data);
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
    await deleteKeyword(user.id, id);
    return NextResponse.json({ data: { success: true }, success: true });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
