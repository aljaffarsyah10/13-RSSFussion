import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { getUserProfile, updateUserProfile } from "@/server/services/user.service";
import { handleApiError } from "@/server/auth/api-error";

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await getUserProfile(user.id);
    return NextResponse.json({ data: profile });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const updated = await updateUserProfile(user.id, {
      fullName: typeof body.fullName === "string" ? body.fullName : undefined,
      organizationName: typeof body.organizationName === "string" ? body.organizationName : undefined,
      avatarUrl: typeof body.avatarUrl === "string" ? body.avatarUrl : undefined,
    });

    return NextResponse.json({ data: updated });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
