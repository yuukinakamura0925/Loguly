import type { TypedClient } from "./types";

export function listOrganizations(client: TypedClient) {
  return client
    .from("organizations")
    .select("*, organization_members(count)")
    .order("created_at", { ascending: false });
}

export function listOrganizationNames(client: TypedClient) {
  return client.from("organizations").select("id, name").order("name");
}

export function getOrganizationById(client: TypedClient, id: string) {
  return client.from("organizations").select("*").eq("id", id).single();
}

export function insertOrganization(client: TypedClient, data: { name: string; slug: string }) {
  return client.from("organizations").insert(data);
}

export function updateOrganization(
  client: TypedClient,
  id: string,
  data: { name?: string; slug?: string; is_active?: boolean }
) {
  return client.from("organizations").update(data).eq("id", id);
}

export function deleteOrganization(client: TypedClient, id: string) {
  return client.from("organizations").delete().eq("id", id);
}

export function countOrganizations(client: TypedClient) {
  return client.from("organizations").select("*", { count: "exact", head: true });
}
