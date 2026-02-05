"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export async function createCategory(formData: FormData) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const displayOrder = parseInt(formData.get("display_order") as string) || 0;

  const { error } = await supabase
    .from("categories")
    .insert({ name, display_order: displayOrder });

  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  return { success: true };
}

export async function updateCategory(id: number, formData: FormData) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const displayOrder = parseInt(formData.get("display_order") as string) || 0;

  const { error } = await supabase
    .from("categories")
    .update({ name, display_order: displayOrder })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  return { success: true };
}

export async function deleteCategory(id: number) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  return { success: true };
}
