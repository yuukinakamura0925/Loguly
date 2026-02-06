"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import {
  insertVideo,
  updateVideo as dbUpdateVideo,
  deleteVideo as dbDeleteVideo,
  getVideoById,
  listVideosByCategory,
  updateVideoOrder,
  insertCategory,
  updateCategory as dbUpdateCategory,
  deleteCategory as dbDeleteCategory,
} from "@/lib/db";

export async function createVideo(formData: FormData) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { error } = await insertVideo(supabase, {
    category_id: parseInt(formData.get("category_id") as string),
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    cf_video_id: formData.get("cf_video_id") as string,
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

  const { error } = await dbUpdateVideo(supabase, id, {
    category_id: parseInt(formData.get("category_id") as string),
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    cf_video_id: formData.get("cf_video_id") as string,
    display_order: parseInt(formData.get("display_order") as string) || 0,
    is_published: formData.get("is_published") === "true",
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/videos");
  return { success: true };
}

export async function deleteVideo(id: number) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { error } = await dbDeleteVideo(supabase, id);

  if (error) return { error: error.message };

  revalidatePath("/admin/videos");
  return { success: true };
}

export async function moveVideo(videoId: number, direction: "up" | "down") {
  await requireRole("platform_admin");
  const supabase = await createClient();

  // Get the video to move
  const { data: video, error: videoError } = await getVideoById(supabase, videoId);
  if (videoError || !video) return { error: "動画が見つかりません" };

  // Get all videos in the same category
  const { data: categoryVideos, error: listError } = await listVideosByCategory(
    supabase,
    video.category_id
  );
  if (listError || !categoryVideos) return { error: "動画一覧の取得に失敗しました" };

  // Find current video index
  const currentIndex = categoryVideos.findIndex((v) => v.id === videoId);
  if (currentIndex === -1) return { error: "動画が見つかりません" };

  // Calculate swap target
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= categoryVideos.length) {
    return { success: true }; // Already at boundary, no-op
  }

  // Swap display_order values
  const currentVideo = categoryVideos[currentIndex];
  const targetVideo = categoryVideos[targetIndex];

  const { error: err1 } = await updateVideoOrder(supabase, currentVideo.id, targetVideo.display_order);
  if (err1) return { error: err1.message };

  const { error: err2 } = await updateVideoOrder(supabase, targetVideo.id, currentVideo.display_order);
  if (err2) return { error: err2.message };

  revalidatePath("/admin/videos");
  return { success: true };
}

// Category actions
export async function createCategory(formData: FormData) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const displayOrder = parseInt(formData.get("display_order") as string) || 0;

  const { error } = await insertCategory(supabase, { name, display_order: displayOrder });

  if (error) return { error: error.message };

  revalidatePath("/admin/videos");
  return { success: true };
}

export async function updateCategory(id: number, formData: FormData) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const displayOrder = parseInt(formData.get("display_order") as string) || 0;

  const { error } = await dbUpdateCategory(supabase, id, { name, display_order: displayOrder });

  if (error) return { error: error.message };

  revalidatePath("/admin/videos");
  return { success: true };
}

export async function deleteCategory(id: number) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { error } = await dbDeleteCategory(supabase, id);

  if (error) return { error: error.message };

  revalidatePath("/admin/videos");
  return { success: true };
}
