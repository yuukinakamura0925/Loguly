"use server";

import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateDisplayName(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "認証されていません" };
  }

  const displayName = formData.get("displayName") as string;

  if (!displayName || displayName.trim().length === 0) {
    return { error: "表示名を入力してください" };
  }

  if (displayName.length > 50) {
    return { error: "表示名は50文字以内で入力してください" };
  }

  const { error } = await updateProfile(supabase, user.id, {
    display_name: displayName.trim(),
  });

  if (error) {
    return { error: "更新に失敗しました" };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "認証されていません" };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "全ての項目を入力してください" };
  }

  if (newPassword.length < 8) {
    return { error: "新しいパスワードは8文字以上で入力してください" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "新しいパスワードが一致しません" };
  }

  // 現在のパスワードを確認するため再ログイン
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });

  if (signInError) {
    return { error: "現在のパスワードが正しくありません" };
  }

  // パスワード更新
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { error: "パスワードの更新に失敗しました" };
  }

  return { success: true };
}

export async function updateEmail(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "認証されていません" };
  }

  const newEmail = formData.get("newEmail") as string;
  const password = formData.get("password") as string;

  if (!newEmail || !password) {
    return { error: "全ての項目を入力してください" };
  }

  // メールアドレス形式チェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    return { error: "有効なメールアドレスを入力してください" };
  }

  // パスワード確認
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: password,
  });

  if (signInError) {
    return { error: "パスワードが正しくありません" };
  }

  // メールアドレス更新（確認メールが送信される）
  const { error: updateError } = await supabase.auth.updateUser({
    email: newEmail,
  });

  if (updateError) {
    if (updateError.message.includes("already registered")) {
      return { error: "このメールアドレスは既に使用されています" };
    }
    return { error: "メールアドレスの更新に失敗しました" };
  }

  // profilesテーブルも更新
  await updateProfile(supabase, user.id, { email: newEmail });

  return { success: true, message: "確認メールを送信しました。メール内のリンクをクリックして変更を完了してください。" };
}

export async function uploadAvatar(formData: FormData) {
  const sharp = (await import("sharp")).default;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "認証されていません" };
  }

  const file = formData.get("avatar") as File;
  if (!file || file.size === 0) {
    return { error: "ファイルを選択してください" };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { error: "ファイルサイズは10MB以下にしてください" };
  }

  if (!file.type.startsWith("image/")) {
    return { error: "画像ファイルを選択してください" };
  }

  // 古いアバターファイルを削除（拡張子が異なる旧ファイル対策）
  const { data: existingFiles } = await supabase.storage
    .from("avatars")
    .list(user.id);
  if (existingFiles && existingFiles.length > 0) {
    const filesToDelete = existingFiles.map((f) => `${user.id}/${f.name}`);
    await supabase.storage.from("avatars").remove(filesToDelete);
  }

  // クロップ座標を取得（クライアントから送信）
  const cropLeft = parseInt(formData.get("cropLeft") as string) || 0;
  const cropTop = parseInt(formData.get("cropTop") as string) || 0;
  const cropSize = parseInt(formData.get("cropSize") as string) || 0;

  // 256x256 WebPに最適化
  const buffer = Buffer.from(await file.arrayBuffer());
  let pipeline = sharp(buffer).rotate(); // EXIF回転を適用

  // クロップ座標がある場合は先にクロップ（範囲制限付き）
  if (cropSize > 0) {
    const meta = await sharp(buffer).rotate().metadata();
    const imgW = meta.width || 0;
    const imgH = meta.height || 0;
    const safeSize = Math.min(cropSize, imgW, imgH);
    const safeLeft = Math.max(0, Math.min(cropLeft, imgW - safeSize));
    const safeTop = Math.max(0, Math.min(cropTop, imgH - safeSize));
    pipeline = pipeline.extract({
      left: safeLeft,
      top: safeTop,
      width: safeSize,
      height: safeSize,
    });
  }

  const optimized = await pipeline
    .resize(256, 256, { fit: "cover" })
    .webp({ quality: 80 })
    .toBuffer();

  const filePath = `${user.id}/avatar.webp`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, optimized, {
      upsert: true,
      contentType: "image/webp",
    });

  if (uploadError) {
    return { error: "アップロードに失敗しました" };
  }

  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  await updateProfile(supabase, user.id, { avatar_url: avatarUrl });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/org/progress");
  return { success: true, avatarUrl };
}

