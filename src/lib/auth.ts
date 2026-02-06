import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getProfileById,
  getMembershipWithOrg,
  findPendingInvitationByEmail,
  insertOrgMember,
  deleteInvitation,
} from "@/lib/db";
import type { Profile, Organization, Role } from "@/types/database";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await getProfileById(supabase, user.id);

  return data as Profile | null;
}

export async function getCurrentOrg(): Promise<Organization | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  let { data: membership } = await getMembershipWithOrg(supabase, user.id);

  // メンバーシップがない場合、保留中の招待を確認して自動受諾
  if (!membership && user.email) {
    // adminクライアントを使用（RLSをバイパス）
    const adminClient = createAdminClient();

    const { data: invitation } = await findPendingInvitationByEmail(
      adminClient,
      user.email
    );

    if (invitation) {
      // organization_membersに追加
      const { error: memberError } = await insertOrgMember(adminClient, {
        organization_id: invitation.organization_id,
        user_id: user.id,
        role: invitation.role,
      });

      if (!memberError) {
        // 招待を削除
        await deleteInvitation(adminClient, invitation.id);

        // メンバーシップを再取得
        const result = await getMembershipWithOrg(supabase, user.id);
        membership = result.data;
      }
    }
  }

  if (!membership) return null;

  return (membership as unknown as { organizations: Organization }).organizations;
}

export async function requireAuth(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireRole(
  ...roles: Role[]
): Promise<Profile> {
  const profile = await requireAuth();
  if (!roles.includes(profile.role)) {
    redirect(profile.role === "platform_admin" ? "/admin" : "/dashboard");
  }
  return profile;
}
