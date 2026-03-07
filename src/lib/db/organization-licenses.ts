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
    .select("expires_at, videos(title, display_order, categories(name, display_order))")
    .eq("organization_id", organizationId)
    .eq("is_active", true);
}

export function listLicensedVideosForOrg(client: TypedClient, organizationId: string) {
  return client
    .from("organization_licenses")
    .select("video_id, display_order, videos(id, category_id, title, description, duration, display_order, categories(name, display_order))")
    .eq("organization_id", organizationId)
    .eq("is_active", true);
}

export function listLicensedVideosForOrgWithStream(client: TypedClient, organizationId: string) {
  return client
    .from("organization_licenses")
    .select("video_id, display_order, videos(id, category_id, title, description, duration, display_order, cf_video_id, categories(name, display_order))")
    .eq("organization_id", organizationId)
    .eq("is_active", true);
}

export function updateLicenseDisplayOrder(
  client: TypedClient,
  organizationId: string,
  videoId: number,
  displayOrder: number
) {
  return client
    .from("organization_licenses")
    .update({ display_order: displayOrder })
    .eq("organization_id", organizationId)
    .eq("video_id", videoId);
}

export function resetLicenseDisplayOrders(client: TypedClient, organizationId: string) {
  return client
    .from("organization_licenses")
    .update({ display_order: null })
    .eq("organization_id", organizationId);
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

export function listLicenseVideoIdsForOrg(client: TypedClient, organizationId: string) {
  return client
    .from("organization_licenses")
    .select("video_id")
    .eq("organization_id", organizationId)
    .eq("is_active", true);
}

export function deleteLicensesByOrgAndVideos(
  client: TypedClient,
  organizationId: string,
  videoIds: number[]
) {
  return client
    .from("organization_licenses")
    .delete()
    .eq("organization_id", organizationId)
    .in("video_id", videoIds);
}

export function insertLicensesBulk(
  client: TypedClient,
  licenses: { organization_id: string; video_id: number; is_active: boolean; expires_at?: string | null }[]
) {
  return client
    .from("organization_licenses")
    .upsert(licenses, { onConflict: "organization_id,video_id" });
}
