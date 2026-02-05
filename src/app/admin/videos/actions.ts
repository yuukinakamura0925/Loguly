"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export async function createVideo(formData: FormData) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { error } = await supabase.from("videos").insert({
    category_id: parseInt(formData.get("category_id") as string),
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    cf_video_id: formData.get("cf_video_id") as string,
    duration: parseInt(formData.get("duration") as string),
    display_order: parseInt(formData.get("display_order") as string) || 0,
    is_published: formData.get("is_published") === "true",
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/videos");
  return { success: true };
}

export async function updateVideo(id: number, formData: FormData) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("videos")
    .update({
      category_id: parseInt(formData.get("category_id") as string),
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      cf_video_id: formData.get("cf_video_id") as string,
      duration: parseInt(formData.get("duration") as string),
      display_order: parseInt(formData.get("display_order") as string) || 0,
      is_published: formData.get("is_published") === "true",
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/videos");
  return { success: true };
}

export async function deleteVideo(id: number) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { error } = await supabase.from("videos").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/videos");
  return { success: true };
}
