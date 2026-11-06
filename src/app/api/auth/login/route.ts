import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { handleApiError } from "@/server/auth/api-error";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Email and password are required" } },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: { code: "AUTH_FAILED", message: error.message } },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: { user: data.user } });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
