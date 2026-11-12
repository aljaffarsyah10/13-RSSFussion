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

      // Check upload size limit: 5MB
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "OPML file exceeds maximum size limit of 5 MB" } },
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

    // Check payload size: 5MB
    if (Buffer.byteLength(xmlContent, "utf8") > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "OPML content exceeds maximum size limit of 5 MB" } },
        { status: 400 }
      );
    }

    // Anti-XXE & DTD injection protection: reject external entities and doctype declarations
    if (
      /<!DOCTYPE/i.test(xmlContent) ||
      /<!ENTITY/i.test(xmlContent) ||
      /\bSYSTEM\b/i.test(xmlContent) ||
      /\bPUBLIC\b/i.test(xmlContent)
    ) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Potentially malicious XML entity declarations (XXE) detected in OPML content",
          },
        },
        { status: 400 }
      );
    }

    const result = await importOpmlFeeds(user.id, xmlContent);
    return NextResponse.json({ data: result });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
