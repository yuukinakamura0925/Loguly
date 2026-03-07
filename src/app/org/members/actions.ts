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

  if (error) return { error: error.message };

  // TODO: Resend APIでメール送信
  // 現時点では招待リンクを返す
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${token}`;

  revalidatePath("/org/members");
  return { success: true, inviteUrl };
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
