import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { updateUserPassword } from "@/server/services/user.service";
import { handleApiError } from "@/server/auth/api-error";

export async function PATCH(request: Request) {
  try {
    await requireUser();
    const body = await request.json();

    const newPassword = body.newPassword;
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "New password must be at least 8 characters" } },
        { status: 400 }
      );
    }

    if (newPassword.length > 128) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Password exceeds maximum limit of 128 characters" } },
        { status: 400 }
      );
    }

    await updateUserPassword(newPassword);
    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
