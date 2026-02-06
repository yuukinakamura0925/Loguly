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

export async function deleteAccount(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "認証されていません" };
  }

  // プラットフォーム管理者は削除不可
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "platform_admin") {
    return { error: "プラットフォーム管理者は削除できません" };
  }

  const password = formData.get("password") as string;
  const confirmation = formData.get("confirmation") as string;

  if (!password) {
    return { error: "パスワードを入力してください" };
  }

  if (confirmation !== "削除する") {
    return { error: "「削除する」と入力してください" };
  }

  // パスワード確認
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: password,
  });

  if (signInError) {
    return { error: "パスワードが正しくありません" };
  }

  // アカウント削除はadmin APIが必要なので、ここではサインアウトのみ
  // 実際の削除はSupabaseのトリガーやadminで行う
  // 今回はprofileをソフトデリートし、サインアウトする

  // organization_membersから削除
  await supabase
    .from("organization_members")
    .delete()
    .eq("user_id", user.id);

  // view_logsから削除
  await supabase
    .from("view_logs")
    .delete()
    .eq("user_id", user.id);

  // profilesから削除
  await supabase
    .from("profiles")
    .delete()
    .eq("id", user.id);

  // サインアウト
  await supabase.auth.signOut();

  return { success: true, redirect: "/login" };
}
