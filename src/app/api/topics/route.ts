import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { listTopics, createTopic } from "@/server/services/topic.service";
import { topicFormSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/server/auth/api-error";

export async function GET() {
  try {
    const user = await requireUser();
    const topics = await listTopics(user.id);
    return NextResponse.json({ data: topics });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const parseResult = topicFormSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid topic data", details: parseResult.error.issues } },
        { status: 400 }
      );
    }

    const topic = await createTopic(user.id, parseResult.data);
    return NextResponse.json({ data: topic }, { status: 201 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
