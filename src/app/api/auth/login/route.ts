import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/server/auth/api-error";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Email and password are required",
            details: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Prevent user enumeration attacks by returning a consistent generic error
      return NextResponse.json(
        { error: { code: "AUTH_FAILED", message: "Invalid email or password" } },
        { status: 401 }
      );
    }

    return NextResponse.json({ data: { user: data.user } });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
