"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, getCurrentOrg, getCurrentUser } from "@/lib/auth";
import {
  findMemberByEmail,
  findPendingInvitation,
  insertInvitation,
  deleteOrgMember,
  deleteInvitation,
} from "@/lib/db";

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

  if (error) return { error: error.message };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite/${token}`;

  // Supabase組み込み招待メール送信
  const adminClient = createAdminClient();
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/invite/setup`,
    data: { invitation_token: token },
  });

  revalidatePath("/org/members");

  if (inviteError) {
    // ユーザーが既に存在する場合など、メール送信失敗時はリンクをフォールバック表示
    return { success: true, inviteUrl, emailError: "招待メールの送信に失敗しました。リンクを手動で共有してください。" };
  }

  return { success: true, emailSent: true };
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

  const { error } = await deleteOrgMember(supabase, org.id, userId);

  if (error) return { error: error.message };

  revalidatePath("/org/members");
  return { success: true };
}

export async function cancelInvitation(invitationId: string) {
  await requireRole("org_admin");
  const supabase = await createClient();

  const { error } = await deleteInvitation(supabase, invitationId);

  if (error) return { error: error.message };

  revalidatePath("/org/members");
  return { success: true };
}
