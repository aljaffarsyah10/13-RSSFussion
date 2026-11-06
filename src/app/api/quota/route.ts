import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { getUserQuotaUsage } from "@/server/services/quota.service";
import { handleApiError } from "@/server/auth/api-error";

export async function GET() {
  try {
    const user = await requireUser();
    const quota = await getUserQuotaUsage(user.id);
    return NextResponse.json({ data: quota });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
