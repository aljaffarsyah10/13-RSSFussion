import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { getUserNotifications } from "@/server/services/notification.service";
import { handleApiError } from "@/server/auth/api-error";

export async function GET() {
  try {
    const user = await requireUser();
    const notifications = await getUserNotifications(user.id);
    return NextResponse.json({ data: notifications });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
