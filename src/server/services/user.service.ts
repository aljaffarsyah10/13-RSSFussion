import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UserProfile } from "@/types/models";

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const supabase = await createServerSupabaseClient();

  const { data: userAuth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !userAuth.user) throw new Error("UNAUTHORIZED");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;

  return {
    id: profile.id,
    email: userAuth.user.email || "",
    fullName: profile.full_name || undefined,
    avatarUrl: profile.avatar_url || undefined,
    plan: profile.plan,
    organizationName: profile.organization_name || "Personal Workspace",
    role: profile.role || "owner",
    onboardingCompleted: Boolean(profile.onboarding_completed),
    createdAt: profile.created_at,
  };
}

export async function updateUserProfile(
  userId: string,
  updates: {
    fullName?: string;
    organizationName?: string;
    avatarUrl?: string;
  }
): Promise<UserProfile> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...(updates.fullName !== undefined && { full_name: updates.fullName.trim() }),
      ...(updates.organizationName !== undefined && { organization_name: updates.organizationName.trim() }),
      ...(updates.avatarUrl !== undefined && { avatar_url: updates.avatarUrl.trim() }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;

  const { data: userAuth } = await supabase.auth.getUser();

  return {
    id: data.id,
    email: userAuth?.user?.email || "",
    fullName: data.full_name || undefined,
    avatarUrl: data.avatar_url || undefined,
    plan: data.plan,
    organizationName: data.organization_name || "Personal Workspace",
    role: data.role || "owner",
    onboardingCompleted: Boolean(data.onboarding_completed),
    createdAt: data.created_at,
  };
}

export async function updateUserPassword(newPassword: string): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}
