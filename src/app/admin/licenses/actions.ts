"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export async function assignLicense(formData: FormData) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const organizationId = formData.get("organization_id") as string;
  const videoId = parseInt(formData.get("video_id") as string);
  const maxViewers = parseInt(formData.get("max_viewers") as string) || 0;
  const expiresAt = (formData.get("expires_at") as string) || null;

  const { error } = await supabase.from("organization_licenses").upsert(
    {
      organization_id: organizationId,
      video_id: videoId,
      max_viewers: maxViewers,
      expires_at: expiresAt,
      is_active: true,
    },
    { onConflict: "organization_id,video_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/admin/licenses");
  return { success: true };
}

export async function updateLicense(id: string, formData: FormData) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const maxViewers = parseInt(formData.get("max_viewers") as string) || 0;
  const expiresAt = (formData.get("expires_at") as string) || null;
  const isActive = formData.get("is_active") === "true";

  const { error } = await supabase
    .from("organization_licenses")
    .update({ max_viewers: maxViewers, expires_at: expiresAt, is_active: isActive })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/licenses");
  return { success: true };
}

export async function revokeLicense(id: string) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("organization_licenses")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/licenses");
  return { success: true };
}
