import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { listSources } from "@/server/services/source.service";
import { generateOpml } from "@/lib/rss/opml-parser";
import { handleApiError } from "@/server/auth/api-error";

export async function GET() {
  try {
    const user = await requireUser();
    const sources = await listSources(user.id);
    const opmlXml = generateOpml(sources, "RSSFusion Subscriptions Export");

    return new NextResponse(opmlXml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": 'attachment; filename="rssfusion-subscriptions.opml"',
      },
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
