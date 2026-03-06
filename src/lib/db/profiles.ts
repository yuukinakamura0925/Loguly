import type { TypedClient } from "./types";

export function getProfileById(client: TypedClient, userId: string) {
  return client.from("profiles").select("*").eq("id", userId).single();
}

export function getProfileRole(client: TypedClient, userId: string) {
  return client.from("profiles").select("role").eq("id", userId).single();
}

export function getProfileByEmail(client: TypedClient, email: string) {
  return client.from("profiles").select("id, role").eq("email", email).single();
}

export function updateProfileRole(client: TypedClient, userId: string, role: string) {
  return client.from("profiles").update({ role }).eq("id", userId);
}

export function updateProfile(
  client: TypedClient,
  userId: string,
  data: { display_name?: string; email?: string; avatar_url?: string | null }
) {
  return client.from("profiles").update(data).eq("id", userId);
}

export function listAllProfiles(client: TypedClient) {
  return client
    .from("profiles")
    .select("id, email, display_name, role")
    .neq("role", "platform_admin")
    .order("display_name");
}

export function listAllProfilesWithOrg(client: TypedClient) {
  return client
    .from("profiles")
    .select("id, email, display_name, role, organization_members(organization_id, organizations(name))")
    .neq("role", "platform_admin")
    .order("display_name");
}
