import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { listSources, createSource } from "@/server/services/source.service";
import { sourceFormSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/server/auth/api-error";

export async function GET() {
  try {
    const user = await requireUser();
    const sources = await listSources(user.id);
    return NextResponse.json({ data: sources });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const parseResult = sourceFormSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid source data", details: parseResult.error.issues } },
        { status: 400 }
      );
    }

    const source = await createSource(user.id, parseResult.data);
    return NextResponse.json({ data: source }, { status: 201 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
