import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { getTrendAnalytics } from "@/server/services/analytics.service";
import { handleApiError } from "@/server/auth/api-error";

export async function GET() {
  try {
    const user = await requireUser();
    const analytics = await getTrendAnalytics(user.id);
    return NextResponse.json({ data: analytics });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
