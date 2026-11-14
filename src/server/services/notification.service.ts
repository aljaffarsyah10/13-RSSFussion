import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface EmailNotificationRecord {
  id: string;
  userId: string;
  articleId: string;
  keywordId?: string;
  recipientEmail: string;
  subject: string;
  status: "pending" | "sent" | "failed" | "skipped";
  idempotencyKey: string;
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function queueKeywordNotification(params: {
  userId: string;
  articleId: string;
  keywordId: string;
  keyword: string;
  articleTitle: string;
  articleUrl: string;
  userEmail: string;
}): Promise<void> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createServerSupabaseClient();

  // 1. Check if user enabled notifications in profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("email_notifications_enabled, notification_email")
    .eq("id", params.userId)
    .single();

  if (profile && profile.email_notifications_enabled === false) {
    return; // User disabled email notifications
  }

  const recipient = profile?.notification_email || params.userEmail;
  if (!recipient) return;

  const idempotencyKey = `kw_notif_${params.userId}_${params.articleId}_${params.keywordId}`;
  const subject = `[RSSFusion Alert] Keyword "${params.keyword}" matched: ${params.articleTitle}`;

  // 2. Insert into email_notifications with ON CONFLICT DO NOTHING
  const { error } = await supabase.from("email_notifications").upsert(
    {
      user_id: params.userId,
      article_id: params.articleId,
      keyword_id: params.keywordId,
      recipient_email: recipient,
      subject,
      status: "pending",
      idempotency_key: idempotencyKey,
    },
    { onConflict: "idempotency_key" }
  );

  if (error) {
    console.error("Failed to queue notification:", error.message);
  }
}

export async function processEmailNotification(notificationId: string): Promise<boolean> {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createServerSupabaseClient();
  const resendApiKey = process.env.RESEND_API_KEY;

  const { data: notif, error } = await supabase
    .from("email_notifications")
    .select("*, articles(title, original_url, description)")
    .eq("id", notificationId)
    .single();

  if (error || !notif) return false;

  // If no Resend API key configured, record as skipped/dry-run
  if (!resendApiKey) {
    await supabase
      .from("email_notifications")
      .update({
        status: "skipped",
        error_message: "RESEND_API_KEY not configured. Notification recorded in dry-run mode.",
        sent_at: new Date().toISOString(),
      })
      .eq("id", notificationId);
    return true;
  }

  const safeUrl = escapeHtml(notif.articles?.original_url || "#");
  const safeTitle = escapeHtml(notif.articles?.title || "Matched Article");
  const safeDescription = escapeHtml(notif.articles?.description || "");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "RSSFusion Alerts <alerts@rssfusion.local>",
        to: [notif.recipient_email],
        subject: notif.subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #111;">Intelligence Keyword Alert</h2>
            <p style="color: #555;">An article matching your watched keyword was newly ingested:</p>
            <div style="border-left: 3px solid #0066cc; padding-left: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px;"><a href="${safeUrl}" style="color: #0066cc; text-decoration: none;">${safeTitle}</a></h3>
              <p style="color: #666; font-size: 14px; margin: 0;">${safeDescription}</p>
            </div>
            <p><a href="${safeUrl}" style="display: inline-block; background: #0066cc; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-size: 14px;">Read Full Story</a></p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0 10px;" />
            <p style="color: #999; font-size: 11px;">RSSFusion Information Intelligence — Manage preferences in Settings.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      await supabase
        .from("email_notifications")
        .update({
          status: "failed",
          error_message: `Resend error: ${errText.slice(0, 300)}`,
        })
        .eq("id", notificationId);
      return false;
    }

    await supabase
      .from("email_notifications")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", notificationId);

    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase
      .from("email_notifications")
      .update({
        status: "failed",
        error_message: msg,
      })
      .eq("id", notificationId);
    return false;
  }
}

export async function getUserNotifications(userId: string): Promise<EmailNotificationRecord[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("email_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    articleId: row.article_id,
    keywordId: row.keyword_id || undefined,
    recipientEmail: row.recipient_email,
    subject: row.subject,
    status: row.status,
    idempotencyKey: row.idempotency_key,
    errorMessage: row.error_message || undefined,
    sentAt: row.sent_at || undefined,
    createdAt: row.created_at,
  }));
}

export async function updateNotificationPreferences(
  userId: string,
  settings: { emailNotificationsEnabled: boolean; notificationEmail?: string }
) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      email_notifications_enabled: settings.emailNotificationsEnabled,
      ...(settings.notificationEmail !== undefined && {
        notification_email: settings.notificationEmail || null,
      }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("email_notifications_enabled, notification_email")
    .single();

  if (error) throw error;
  return {
    emailNotificationsEnabled: data.email_notifications_enabled,
    notificationEmail: data.notification_email || "",
    email_notifications_enabled: data.email_notifications_enabled,
    notification_email: data.notification_email,
  };
}
