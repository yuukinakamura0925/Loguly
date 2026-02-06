"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole, getCurrentOrg } from "@/lib/auth";
import { updateOrganization } from "@/lib/db";

export async function updateOrgSettings(formData: FormData) {
  await requireRole("org_admin");
  const org = await getCurrentOrg();
  if (!org) return { error: "組織が見つかりません" };

  const supabase = await createClient();
  const name = formData.get("name") as string;

  const { error } = await updateOrganization(supabase, org.id, { name });

  if (error) return { error: error.message };

  revalidatePath("/org/settings");
  return { success: true };
}
