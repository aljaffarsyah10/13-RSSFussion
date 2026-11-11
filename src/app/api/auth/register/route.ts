import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/server/auth/api-error";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid registration details",
            details: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { email, password, fullName } = parsed.data;
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || "",
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { error: { code: "AUTH_FAILED", message: error.message } },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: { user: data.user } }, { status: 201 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
