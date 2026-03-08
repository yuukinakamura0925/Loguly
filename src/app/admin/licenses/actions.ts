"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import {
  upsertLicense,
  updateLicense as dbUpdateLicense,
  deleteLicense,
  deleteLicensesByOrgAndVideos,
  insertLicensesBulk,
} from "@/lib/db";
import { toJapaneseError } from "@/lib/error-messages";

export async function assignLicense(formData: FormData) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { error } = await upsertLicense(supabase, {
    organization_id: formData.get("organization_id") as string,
    video_id: parseInt(formData.get("video_id") as string),
    expires_at: (formData.get("expires_at") as string) || null,
    is_active: true,
  });

  if (error) return { error: toJapaneseError(error.message) };

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

  if (error) return { error: toJapaneseError(error.message) };

  revalidatePath("/admin/licenses");
  return { success: true };
}

export async function revokeLicense(id: string) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { error } = await deleteLicense(supabase, id);

  if (error) return { error: toJapaneseError(error.message) };

  revalidatePath("/admin/licenses");
  return { success: true };
}

export async function updateOrgLicenses(
  organizationId: string,
  selectedVideoIds: number[],
  allVideoIds: number[],
  videoExpiresMap: Record<string, string | null>
) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  // Remove licenses for unchecked videos
  const uncheckedIds = allVideoIds.filter((id) => !selectedVideoIds.includes(id));
  if (uncheckedIds.length > 0) {
    const { error: deleteError } = await deleteLicensesByOrgAndVideos(
      supabase,
      organizationId,
      uncheckedIds
    );
    if (deleteError) return { error: toJapaneseError(deleteError.message) };
  }

  // Add licenses for checked videos with per-video expiry
  if (selectedVideoIds.length > 0) {
    const licenses = selectedVideoIds.map((videoId) => ({
      organization_id: organizationId,
      video_id: videoId,
      is_active: true,
      expires_at: videoExpiresMap[String(videoId)] ?? null,
    }));
    const { error: insertError } = await insertLicensesBulk(supabase, licenses);
    if (insertError) return { error: toJapaneseError(insertError.message) };
  }

  revalidatePath("/admin/licenses");
  return { success: true };
}
