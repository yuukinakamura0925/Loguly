"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import {
  upsertLicense,
  updateLicense as dbUpdateLicense,
  deleteLicense,
} from "@/lib/db";

export async function assignLicense(formData: FormData) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { error } = await upsertLicense(supabase, {
    organization_id: formData.get("organization_id") as string,
    video_id: parseInt(formData.get("video_id") as string),
    expires_at: (formData.get("expires_at") as string) || null,
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/licenses");
  return { success: true };
}

export async function updateLicense(id: string, formData: FormData) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { error } = await dbUpdateLicense(supabase, id, {
    expires_at: (formData.get("expires_at") as string) || null,
    is_active: formData.get("is_active") === "true",
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/licenses");
  return { success: true };
}

export async function revokeLicense(id: string) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { error } = await deleteLicense(supabase, id);

  if (error) return { error: error.message };

  revalidatePath("/admin/licenses");
  return { success: true };
}
