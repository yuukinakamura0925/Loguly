"use server";

import { createClient } from "@/lib/supabase/server";
import { getProfileByEmail } from "@/lib/db";

export async function requestPasswordReset(email: string) {
  const supabase = await createClient();

  // メールアドレスが登録されているか確認
  const { data: profile } = await getProfileByEmail(supabase, email);

  if (!profile) {
    return { error: "このメールアドレスは登録されていません" };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password/update`,
  });

  if (error) {
    return { error: "リセットメールの送信に失敗しました。もう一度お試しください。" };
  }

  return { success: true };
}
