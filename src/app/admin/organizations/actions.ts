"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export async function createOrganization(formData: FormData) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;

  const { error } = await supabase.from("organizations").insert({ name, slug });

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
  const slug = formData.get("slug") as string;
  const isActive = formData.get("is_active") === "true";

  const { error } = await supabase
    .from("organizations")
    .update({ name, slug, is_active: isActive })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/organizations");
  return { success: true };
}

export async function deleteOrganization(id: string) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("organizations")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/organizations");
  return { success: true };
}
