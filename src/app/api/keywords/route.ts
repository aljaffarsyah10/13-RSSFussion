import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { listKeywords, createKeyword } from "@/server/services/keyword.service";
import { keywordFormSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/server/auth/api-error";

export async function GET() {
  try {
    const user = await requireUser();
    const keywords = await listKeywords(user.id);
    return NextResponse.json({ data: keywords });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const parseResult = keywordFormSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid keyword data", details: parseResult.error.issues } },
        { status: 400 }
      );
    }

    const keyword = await createKeyword(user.id, parseResult.data);
    return NextResponse.json({ data: keyword }, { status: 201 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
