import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { refreshAllSources } from "@/server/services/source.service";
import { handleApiError } from "@/server/auth/api-error";

export async function POST() {
  try {
    const user = await requireUser();
    const result = await refreshAllSources(user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
