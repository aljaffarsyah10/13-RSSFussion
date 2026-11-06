import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateNotificationPreferences } from "@/server/services/notification.service";
import { handleApiError } from "@/server/auth/api-error";

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabaseClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("email_notifications_enabled, notification_email")
      .eq("id", user.id)
      .single();

    if (error) throw error;
    return NextResponse.json({
      data: {
        emailNotificationsEnabled: profile?.email_notifications_enabled ?? true,
        notificationEmail: profile?.notification_email || user.email || "",
      },
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const updated = await updateNotificationPreferences(user.id, {
      emailNotificationsEnabled: Boolean(body.emailNotificationsEnabled),
      notificationEmail: body.notificationEmail,
    });

    return NextResponse.json({ data: updated });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
