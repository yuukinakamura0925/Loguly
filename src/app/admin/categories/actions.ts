"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import {
  insertCategory,
  updateCategory as dbUpdateCategory,
  deleteCategory as dbDeleteCategory,
} from "@/lib/db";
import { toJapaneseError } from "@/lib/error-messages";

export async function createCategory(formData: FormData) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const displayOrder = parseInt(formData.get("display_order") as string) || 0;

  const { error } = await insertCategory(supabase, { name, display_order: displayOrder });

  if (error) return { error: toJapaneseError(error.message) };

  revalidatePath("/admin/categories");
  return { success: true };
}

export async function updateCategory(id: number, formData: FormData) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const displayOrder = parseInt(formData.get("display_order") as string) || 0;

  const { error } = await dbUpdateCategory(supabase, id, { name, display_order: displayOrder });

  if (error) return { error: toJapaneseError(error.message) };

  revalidatePath("/admin/categories");
  return { success: true };
}

export async function deleteCategory(id: number) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { error } = await dbDeleteCategory(supabase, id);

  if (error) return { error: toJapaneseError(error.message) };

  revalidatePath("/admin/categories");
  return { success: true };
}
