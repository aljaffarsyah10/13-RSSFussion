import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { getDashboardStats } from "@/server/services/dashboard.service";
import { handleApiError } from "@/server/auth/api-error";

export async function GET() {
  try {
    const user = await requireUser();
    const stats = await getDashboardStats(user.id);
    return NextResponse.json({ data: stats });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
