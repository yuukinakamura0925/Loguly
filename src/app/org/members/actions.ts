"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole, getCurrentOrg, getCurrentUser } from "@/lib/auth";
import {
  findMemberByEmail,
  countOrgAdmins,
  findPendingInvitation,
  insertInvitation,
  deleteOrgMember,
  deleteInvitation,
  updateInvitationEmailSent,
  countEmailsSentThisMonth,
} from "@/lib/db";
import { toJapaneseError } from "@/lib/error-messages";
import { sendInvitationEmail } from "@/lib/email";

export async function createInvitation(formData: FormData) {
  await requireRole("org_admin");
  const org = await getCurrentOrg();
  const user = await getCurrentUser();
  if (!org || !user) return { error: "認証エラー" };

  const supabase = await createClient();
  const email = formData.get("email") as string;
  const role = (formData.get("role") as string) || "member";

  // 既にメンバーか確認
  const { data: existingMember } = await findMemberByEmail(supabase, org.id, email);

  if (existingMember) {
    return { error: "このメールアドレスは既にメンバーです" };
  }

  // org_admin上限チェック
  if (role === "org_admin") {
    const { count } = await countOrgAdmins(supabase, org.id);
    const max = org.max_org_admins ?? 1;
    if ((count ?? 0) >= max) {
      return { error: `組織管理者の上限（${max}人）に達しています` };
    }
  }

  // 未使用の招待が既にあるか確認
  const { data: existingInvite } = await findPendingInvitation(supabase, org.id, email);

  if (existingInvite) {
    return { error: "このメールアドレスには既に招待を送信済みです" };
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error } = await insertInvitation(supabase, {
    organization_id: org.id,
    email,
    role,
    token,
    invited_by: user.id,
    expires_at: expiresAt.toISOString(),
  });

  if (error) return { error: toJapaneseError(error.message) };

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${token}`;

  return { success: true, inviteUrl, invitationId: token };
}

export async function sendInviteEmail(invitationId: string) {
  await requireRole("org_admin");
  const org = await getCurrentOrg();
  if (!org) return { error: "認証エラー" };

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return { error: "メール送信が設定されていません" };
  }

  const supabase = await createClient();

  // 今月の送信数チェック
  const { count } = await countEmailsSentThisMonth(supabase);
  if ((count ?? 0) >= 500) {
    return { error: "今月のメール送信上限（500通）に達しています" };
  }

  // 招待情報を取得
  const { data: invitation } = await supabase
    .from("invitations")
    .select("id, email, token")
    .eq("token", invitationId)
    .eq("organization_id", org.id)
    .is("accepted_at", null)
    .single();

  if (!invitation) {
    return { error: "招待が見つかりません" };
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${invitation.token}`;
  const emailResult = await sendInvitationEmail(invitation.email, inviteUrl, org.name);

  if (emailResult.error) {
    return { error: `メール送信に失敗しました: ${emailResult.error}` };
  }

  await updateInvitationEmailSent(supabase, invitation.id);
  return { success: true };
}

export async function getEmailQuota() {
  await requireRole("org_admin");
  const supabase = await createClient();
  const { count } = await countEmailsSentThisMonth(supabase);
  return { used: count ?? 0, limit: 500 };
}

export async function removeMember(userId: string) {
  await requireRole("org_admin");
  const org = await getCurrentOrg();
  const user = await getCurrentUser();
  if (!org || !user) return { error: "認証エラー" };

  if (userId === user.id) {
    return { error: "自分自身を削除することはできません" };
  }

  const supabase = await createClient();

  // org_adminは削除不可
  const { data: member } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", userId)
    .single();

  if (member?.role === "org_admin") {
    return { error: "組織管理者は削除できません" };
  }

  const { error } = await deleteOrgMember(supabase, org.id, userId);

  if (error) return { error: toJapaneseError(error.message) };

  revalidatePath("/org/members");
  return { success: true };
}

export async function cancelInvitation(invitationId: string) {
  await requireRole("org_admin");
  const supabase = await createClient();

  const { error } = await deleteInvitation(supabase, invitationId);

  if (error) return { error: toJapaneseError(error.message) };

  revalidatePath("/org/members");
  return { success: true };
}
