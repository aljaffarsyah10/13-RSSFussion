import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { importOpmlFeeds } from "@/server/services/opml.service";
import { handleApiError } from "@/server/auth/api-error";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const contentType = request.headers.get("content-type") || "";

    let xmlContent = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "OPML file is required" } },
          { status: 400 }
        );
      }
      xmlContent = await file.text();
    } else {
      const body = await request.json();
      xmlContent = body.xmlContent;
    }

    if (!xmlContent || !xmlContent.trim()) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "XML content is empty" } },
        { status: 400 }
      );
    }

    const result = await importOpmlFeeds(user.id, xmlContent);
    return NextResponse.json({ data: result });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
