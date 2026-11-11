import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { handleApiError } from "@/server/auth/api-error";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    return NextResponse.json({ data: { success: true }, success: true });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
