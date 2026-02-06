import type { TypedClient } from "./types";

export function listLicensesWithDetails(client: TypedClient) {
  return client
    .from("organization_licenses")
    .select("*, organizations(name), videos(title)")
    .order("created_at", { ascending: false });
}

export function listActiveLicensesForOrg(client: TypedClient, organizationId: string) {
  return client
    .from("organization_licenses")
    .select("expires_at, videos(title)")
    .eq("organization_id", organizationId)
    .eq("is_active", true);
}

export function listLicensedVideosForOrg(client: TypedClient, organizationId: string) {
  return client
    .from("organization_licenses")
    .select("video_id, videos(id, title, duration, display_order)")
    .eq("organization_id", organizationId)
    .eq("is_active", true);
}

export function upsertLicense(
  client: TypedClient,
  data: { organization_id: string; video_id: number; expires_at: string | null; is_active: boolean }
) {
  return client
    .from("organization_licenses")
    .upsert(data, { onConflict: "organization_id,video_id" });
}

export function updateLicense(
  client: TypedClient,
  id: string,
  data: { expires_at: string | null; is_active: boolean }
) {
  return client.from("organization_licenses").update(data).eq("id", id);
}

export function deleteLicense(client: TypedClient, id: string) {
  return client.from("organization_licenses").delete().eq("id", id);
}

export function countLicenses(client: TypedClient) {
  return client.from("organization_licenses").select("*", { count: "exact", head: true });
}
