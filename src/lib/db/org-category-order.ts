import type { TypedClient } from "./types";

export function listOrgCategoryOrder(client: TypedClient, organizationId: string) {
  return client
    .from("org_category_order")
    .select("category_id, display_order")
    .eq("organization_id", organizationId)
    .order("display_order");
}

export function upsertOrgCategoryOrder(
  client: TypedClient,
  organizationId: string,
  categoryId: number,
  displayOrder: number
) {
  return client
    .from("org_category_order")
    .upsert(
      { organization_id: organizationId, category_id: categoryId, display_order: displayOrder },
      { onConflict: "organization_id,category_id" }
    );
}

export function deleteOrgCategoryOrders(client: TypedClient, organizationId: string) {
  return client
    .from("org_category_order")
    .delete()
    .eq("organization_id", organizationId);
}
