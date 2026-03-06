"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole, getCurrentOrg } from "@/lib/auth";
import {
  updateLicenseDisplayOrder,
  resetLicenseDisplayOrders,
  upsertOrgCategoryOrder,
  deleteOrgCategoryOrders,
} from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function reorderOrgVideos(orderedVideoIds: number[]) {
  await requireRole("org_admin");
  const org = await getCurrentOrg();
  if (!org) return { error: "組織が見つかりません" };

  const supabase = await createClient();

  for (let i = 0; i < orderedVideoIds.length; i++) {
    const { error } = await updateLicenseDisplayOrder(
      supabase,
      org.id,
      orderedVideoIds[i],
      i + 1
    );
    if (error) return { error: error.message };
  }

  revalidatePath("/org/videos");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function reorderOrgCategories(orderedCategoryIds: number[]) {
  await requireRole("org_admin");
  const org = await getCurrentOrg();
  if (!org) return { error: "組織が見つかりません" };

  const supabase = await createClient();

  for (let i = 0; i < orderedCategoryIds.length; i++) {
    const { error } = await upsertOrgCategoryOrder(
      supabase,
      org.id,
      orderedCategoryIds[i],
      i + 1
    );
    if (error) return { error: error.message };
  }

  revalidatePath("/org/videos");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function resetOrgDisplayOrder() {
  await requireRole("org_admin");
  const org = await getCurrentOrg();
  if (!org) return { error: "組織が見つかりません" };

  const supabase = await createClient();

  await resetLicenseDisplayOrders(supabase, org.id);
  await deleteOrgCategoryOrders(supabase, org.id);

  revalidatePath("/org/videos");
  revalidatePath("/dashboard");
  return { success: true };
}
