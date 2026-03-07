"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getProfileByEmail } from "@/lib/db";

export async function requestPasswordReset(email: string) {
  const admin = createAdminClient();

  // メールアドレスが登録されているか確認（RLSバイパスのためadminクライアントを使用）
  const { data: profile } = await getProfileByEmail(admin, email);

  if (!profile) {
    return { error: "このメールアドレスは登録されていません" };
  }

  const { error } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password/update`,
  });

  if (error) {
    console.error("resetPasswordForEmail error:", error.message);
    return { error: `リセットメールの送信に失敗しました: ${error.message}` };
  }

  return { success: true };
}
