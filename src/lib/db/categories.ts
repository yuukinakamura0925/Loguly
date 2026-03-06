import type { TypedClient } from "./types";

export function listCategories(client: TypedClient) {
  return client.from("categories").select("*").order("display_order");
}

export function listCategoryNames(client: TypedClient) {
  return client.from("categories").select("id, name").order("display_order");
}

export function insertCategory(
  client: TypedClient,
  data: { name: string; display_order: number }
) {
  return client.from("categories").insert(data);
}

export function updateCategory(
  client: TypedClient,
  id: number,
  data: { name: string; display_order: number }
) {
  return client.from("categories").update(data).eq("id", id);
}

export function updateCategoryOrder(client: TypedClient, id: number, displayOrder: number) {
  return client.from("categories").update({ display_order: displayOrder }).eq("id", id);
}

export function deleteCategory(client: TypedClient, id: number) {
  return client.from("categories").delete().eq("id", id);
}

export function countCategories(client: TypedClient) {
  return client.from("categories").select("*", { count: "exact", head: true });
}
