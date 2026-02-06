import type { TypedClient } from "./types";

export function getMembershipByUserId(client: TypedClient, userId: string) {
  return client
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .single();
}

export function getMembershipWithOrg(client: TypedClient, userId: string) {
  return client
    .from("organization_members")
    .select("organization_id, organizations(*)")
    .eq("user_id", userId)
    .limit(1)
    .single();
}

export function listOrgMembers(client: TypedClient, organizationId: string) {
  return client
    .from("organization_members")
    .select("id, user_id, role, profiles(email, display_name)")
    .eq("organization_id", organizationId)
    .order("joined_at");
}

export function listOrgMembersWithJoinDate(client: TypedClient, organizationId: string) {
  return client
    .from("organization_members")
    .select("user_id, role, joined_at, profiles(display_name, email)")
    .eq("organization_id", organizationId)
    .order("joined_at");
}

export function listOrgMemberProfiles(client: TypedClient, organizationId: string) {
  return client
    .from("organization_members")
    .select("user_id, profiles(display_name, email)")
    .eq("organization_id", organizationId)
    .order("joined_at");
}

export function findExistingMembership(client: TypedClient, userId: string) {
  return client
    .from("organization_members")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
}

export function findMemberByEmail(
  client: TypedClient,
  organizationId: string,
  email: string
) {
  return client
    .from("organization_members")
    .select("id, profiles!inner(email)")
    .eq("organization_id", organizationId)
    .eq("profiles.email", email)
    .limit(1)
    .maybeSingle();
}

export function insertOrgMember(
  client: TypedClient,
  data: { organization_id: string; user_id: string; role: string }
) {
  return client.from("organization_members").insert(data);
}

export function deleteOrgMember(
  client: TypedClient,
  organizationId: string,
  userId: string
) {
  return client
    .from("organization_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("user_id", userId);
}
