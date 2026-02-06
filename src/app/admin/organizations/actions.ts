"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import {
  insertOrganization,
  updateOrganization as dbUpdateOrganization,
  deleteOrganization as dbDeleteOrganization,
  getProfileByEmail,
  updateProfileRole,
  findExistingMembership,
  insertOrgMember,
  deleteOrgMember,
} from "@/lib/db";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || `org-${Date.now()}`;
}

export async function createOrganization(formData: FormData) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const slug = generateSlug(name);

  const { error } = await insertOrganization(supabase, { name, slug });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/organizations");
  return { success: true };
}

export async function updateOrganization(id: string, formData: FormData) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const isActive = formData.get("is_active") === "true";

  const { error } = await dbUpdateOrganization(supabase, id, { name, is_active: isActive });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/organizations");
  return { success: true };
}

export async function addOrgMember(formData: FormData) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const organizationId = formData.get("organization_id") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as string;

  const { data: profile } = await getProfileByEmail(supabase, email);

  if (!profile) {
    return { error: "このメールアドレスのユーザーが見つかりません" };
  }

  const { data: existing } = await findExistingMembership(supabase, profile.id);

  if (existing) {
    return { error: "このユーザーは既に組織に所属しています" };
  }

  const { error: memberError } = await insertOrgMember(supabase, {
    organization_id: organizationId,
    user_id: profile.id,
    role,
  });

  if (memberError) return { error: memberError.message };

  const { error: profileError } = await updateProfileRole(supabase, profile.id, role);

  if (profileError) return { error: profileError.message };

  revalidatePath(`/admin/organizations/${organizationId}`);
  return { success: true };
}

export async function removeOrgMember(organizationId: string, userId: string) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { error: memberError } = await deleteOrgMember(supabase, organizationId, userId);

  if (memberError) return { error: memberError.message };

  const { error: profileError } = await updateProfileRole(supabase, userId, "member");

  if (profileError) return { error: profileError.message };

  revalidatePath(`/admin/organizations/${organizationId}`);
  return { success: true };
}

export async function createOrgUser(organizationId: string, formData: FormData) {
  await requireRole("platform_admin");
  const admin = createAdminClient();
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("display_name") as string;
  const role = formData.get("role") as string;

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName || email },
  });

  if (authError) {
    if (authError.message.includes("already been registered")) {
      return { error: "このメールアドレスは既に登録されています" };
    }
    return { error: authError.message };
  }

  const { error: memberError } = await insertOrgMember(supabase, {
    organization_id: organizationId,
    user_id: authData.user.id,
    role,
  });

  if (memberError) return { error: memberError.message };

  const { error: profileError } = await updateProfileRole(supabase, authData.user.id, role);

  if (profileError) return { error: profileError.message };

  revalidatePath(`/admin/organizations/${organizationId}`);
  return { success: true };
}

export async function deleteOrganization(id: string) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { error } = await dbDeleteOrganization(supabase, id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/organizations");
  return { success: true };
}
