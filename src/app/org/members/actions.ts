"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole, getCurrentOrg, getCurrentUser } from "@/lib/auth";

export async function createInvitation(formData: FormData) {
  await requireRole("org_admin");
  const org = await getCurrentOrg();
  const user = await getCurrentUser();
  if (!org || !user) return { error: "認証エラー" };

  const supabase = await createClient();
  const email = formData.get("email") as string;
  const role = (formData.get("role") as string) || "member";

  // 既にメンバーか確認
  const { data: existingMember } = await supabase
    .from("organization_members")
    .select("id, profiles!inner(email)")
    .eq("organization_id", org.id)
    .eq("profiles.email", email)
    .limit(1)
    .maybeSingle();

  if (existingMember) {
    return { error: "このメールアドレスは既にメンバーです" };
  }

  // 未使用の招待が既にあるか確認
  const { data: existingInvite } = await supabase
    .from("invitations")
    .select("id")
    .eq("organization_id", org.id)
    .eq("email", email)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (existingInvite) {
    return { error: "このメールアドレスには既に招待を送信済みです" };
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error } = await supabase.from("invitations").insert({
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

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", org.id)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/org/members");
  return { success: true };
}

export async function cancelInvitation(invitationId: string) {
  await requireRole("org_admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", invitationId);

  if (error) return { error: error.message };

  revalidatePath("/org/members");
  return { success: true };
}
