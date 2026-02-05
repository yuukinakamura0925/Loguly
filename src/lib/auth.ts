import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Organization, Role } from "@/types/database";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data as Profile | null;
}

export async function getCurrentOrg(): Promise<Organization | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, organizations(*)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) return null;

  return (membership as unknown as { organizations: Organization }).organizations;
}

export async function requireAuth(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireRole(
  ...roles: Role[]
): Promise<Profile> {
  const profile = await requireAuth();
  if (!roles.includes(profile.role)) {
    redirect(profile.role === "platform_admin" ? "/admin" : "/dashboard");
  }
  return profile;
}
