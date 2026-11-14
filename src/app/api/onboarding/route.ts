import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { getOnboardingState, completeOnboarding } from "@/server/services/onboarding.service";
import { handleApiError } from "@/server/auth/api-error";

export async function GET() {
  try {
    const user = await requireUser();
    const state = await getOnboardingState(user.id);
    return NextResponse.json({ data: state });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const result = await completeOnboarding(user.id, {
      selectedPresetId: typeof body.selectedPresetId === "string" ? body.selectedPresetId : undefined,
      customTopicName: typeof body.customTopicName === "string" ? body.customTopicName : undefined,
      customKeyword: typeof body.customKeyword === "string" ? body.customKeyword : undefined,
      selectedFeedUrls: Array.isArray(body.selectedFeedUrls) ? body.selectedFeedUrls : undefined,
    });

    return NextResponse.json({ data: result });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
