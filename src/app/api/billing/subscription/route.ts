import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import {
  getUserSubscription,
  changeUserPlan,
  cancelSubscription,
} from "@/server/services/billing.service";
import { handleApiError } from "@/server/auth/api-error";
import { BillingCycle, SubscriptionPlan } from "@/types/models";

export async function GET() {
  try {
    const user = await requireUser();
    const subscription = await getUserSubscription(user.id);
    return NextResponse.json({ data: subscription });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const plan = body.plan as SubscriptionPlan;
    const cycle = (body.billingCycle as BillingCycle) || "monthly";

    if (!["free", "starter", "pro", "business"].includes(plan)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid subscription plan selected" } },
        { status: 400 }
      );
    }

    const result = await changeUserPlan(user.id, plan, cycle);
    return NextResponse.json({ data: result });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function DELETE() {
  try {
    const user = await requireUser();
    const canceled = await cancelSubscription(user.id);
    return NextResponse.json({ data: canceled });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
