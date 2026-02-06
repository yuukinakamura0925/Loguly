"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getValidInvitationByToken,
  insertOrgMember,
  deleteInvitation,
  getProfileByEmail,
} from "@/lib/db";

export async function acceptInvitation(token: string, email: string) {
  const adminClient = createAdminClient();

  // 招待を取得
  const { data: invitation } = await getValidInvitationByToken(adminClient, token);

  if (!invitation) {
    return { error: "招待が見つかりません、または期限切れです" };
  }

  // メールアドレスの確認
  if (invitation.email !== email) {
    return { error: "招待されたメールアドレスと異なります" };
  }

  // プロフィールからユーザーIDを取得
  const { data: profile } = await getProfileByEmail(adminClient, email);

  if (!profile) {
    return { error: "ユーザーが見つかりません" };
  }

  // organization_membersに追加
  const { error: memberError } = await insertOrgMember(adminClient, {
    organization_id: invitation.organization_id,
    user_id: profile.id,
    role: invitation.role,
  });

  if (memberError) {
    // 既にメンバーの場合は成功扱い
    if (memberError.code === "23505") {
      await deleteInvitation(adminClient, invitation.id);
      return { success: true };
    }
    console.error("insertOrgMember error:", memberError);
    return { error: "組織への参加に失敗しました" };
  }

  // 招待を削除
  await deleteInvitation(adminClient, invitation.id);

  return { success: true };
}
