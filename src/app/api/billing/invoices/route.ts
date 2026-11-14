import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { listUserInvoices } from "@/server/services/billing.service";
import { handleApiError } from "@/server/auth/api-error";

export async function GET() {
  try {
    const user = await requireUser();
    const invoices = await listUserInvoices(user.id);
    return NextResponse.json({ data: invoices });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
