"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { GalleryImage, GalleryFolder } from "@/types/database";

// ── フォルダ ──

export async function getGalleryFolders(): Promise<GalleryFolder[]> {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gallery_folders")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as GalleryFolder[];
}

export async function createGalleryFolder(name: string, parentId: number | null = null) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const trimmed = name.trim();
  if (!trimmed) return { error: "フォルダ名を入力してください", folder: null };
  if (trimmed.length > 100) return { error: "フォルダ名は100文字以内にしてください", folder: null };

  // 同じ階層に同名フォルダがないかチェック
  const { data: existing } = parentId === null
    ? await supabase.from("gallery_folders").select("id").eq("name", trimmed).is("parent_id", null).limit(1)
    : await supabase.from("gallery_folders").select("id").eq("name", trimmed).eq("parent_id", parentId).limit(1);
  if (existing && existing.length > 0) {
    return { error: `「${trimmed}」はすでに存在します`, folder: null };
  }

  const { data, error } = await supabase
    .from("gallery_folders")
    .insert({ name: trimmed, parent_id: parentId })
    .select()
    .single();

  if (error) return { error: error.message, folder: null };
  return { error: null, folder: data as GalleryFolder };
}

export async function renameGalleryFolder(id: number, name: string) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const trimmed = name.trim();
  if (!trimmed) return { error: "フォルダ名を入力してください" };
  if (trimmed.length > 100) return { error: "フォルダ名は100文字以内にしてください" };

  const { error } = await supabase
    .from("gallery_folders")
    .update({ name: trimmed })
    .eq("id", id);

  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteGalleryFolder(id: number) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("gallery_folders")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  return { error: null };
}

export async function moveFolderToParent(folderId: number, parentId: number | null) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  // 自分自身や自分の子孫には移動できない
  if (parentId === folderId) return { error: "自分自身には移動できません" };

  const { error } = await supabase
    .from("gallery_folders")
    .update({ parent_id: parentId })
    .eq("id", folderId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function moveImageToFolder(imageId: number, folderId: number | null) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("gallery_images")
    .update({ folder_id: folderId })
    .eq("id", imageId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function moveImagesToFolder(imageIds: number[], folderId: number | null) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("gallery_images")
    .update({ folder_id: folderId })
    .in("id", imageIds);

  if (error) return { error: error.message };
  return { error: null };
}

export async function renameGalleryImage(id: number, fileName: string) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const trimmed = fileName.trim();
  if (!trimmed) return { error: "ファイル名を入力してください" };
  if (trimmed.length > 200) return { error: "ファイル名は200文字以内にしてください" };

  const { error } = await supabase
    .from("gallery_images")
    .update({ file_name: trimmed })
    .eq("id", id);

  if (error) return { error: error.message };
  return { error: null };
}

// ── 画像 ──

export async function getGalleryImages(): Promise<GalleryImage[]> {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as GalleryImage[];
}

export async function uploadGalleryImage(formData: FormData) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const file = formData.get("file") as File;
  if (!file) return { error: "ファイルが選択されていません" };

  const folderId = formData.get("folderId");
  const parsedFolderId = folderId ? Number(folderId) : null;

  // バリデーション
  if (!file.type.startsWith("image/")) {
    return { error: "画像ファイルのみアップロードできます" };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { error: "ファイルサイズは20MB以下にしてください" };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "認証エラー" };

  // ユニークなパス生成
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const filePath = `${timestamp}-${randomId}.${ext}`;

  // Storageにアップロード
  const { error: uploadError } = await supabase.storage
    .from("gallery")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) return { error: uploadError.message };

  // DBにメタデータ保存
  const { error: dbError } = await supabase
    .from("gallery_images")
    .insert({
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      content_type: file.type,
      uploaded_by: user.id,
      folder_id: parsedFolderId,
    });

  if (dbError) {
    // DB保存失敗時はStorageのファイルも削除
    await supabase.storage.from("gallery").remove([filePath]);
    return { error: dbError.message };
  }

  return { error: null };
}

export async function deleteGalleryImage(id: number) {
  await requireRole("platform_admin");
  const supabase = await createClient();

  // まずDBからファイルパスを取得
  const { data: image } = await supabase
    .from("gallery_images")
    .select("file_path")
    .eq("id", id)
    .single();

  if (!image) return { error: "画像が見つかりません" };

  // Storageから削除
  await supabase.storage.from("gallery").remove([image.file_path]);

  // DBから削除
  const { error } = await supabase
    .from("gallery_images")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  return { error: null };
}

export async function getGalleryPublicUrl(filePath: string): Promise<string> {
  const supabase = await createClient();
  const { data } = supabase.storage.from("gallery").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function getGalleryStorageUsage(): Promise<{ totalBytes: number; imageCount: number }> {
  await requireRole("platform_admin");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gallery_images")
    .select("file_size");

  if (error) return { totalBytes: 0, imageCount: 0 };

  const totalBytes = (data ?? []).reduce((sum, img) => sum + (img.file_size || 0), 0);
  return { totalBytes, imageCount: data?.length ?? 0 };
}
