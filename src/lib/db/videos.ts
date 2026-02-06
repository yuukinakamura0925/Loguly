import type { TypedClient } from "./types";

export function listVideosWithCategory(client: TypedClient) {
  return client.from("videos").select("*, categories(name)").order("display_order");
}

export function listVideoNames(client: TypedClient) {
  return client.from("videos").select("id, title").order("title");
}

export function listPublishedVideos(client: TypedClient) {
  return client.from("videos").select("*").eq("is_published", true).order("display_order");
}

export function getPublishedVideoById(client: TypedClient, videoId: number) {
  return client
    .from("videos")
    .select("*, categories(name)")
    .eq("id", videoId)
    .eq("is_published", true)
    .single();
}

export function insertVideo(
  client: TypedClient,
  data: {
    category_id: number;
    title: string;
    description: string | null;
    cf_video_id: string;
    display_order: number;
    is_published: boolean;
  }
) {
  return client.from("videos").insert(data);
}

export function updateVideo(
  client: TypedClient,
  id: number,
  data: {
    category_id: number;
    title: string;
    description: string | null;
    cf_video_id: string;
    display_order: number;
    is_published: boolean;
  }
) {
  return client.from("videos").update(data).eq("id", id);
}

export function deleteVideo(client: TypedClient, id: number) {
  return client.from("videos").delete().eq("id", id);
}

export function countVideos(client: TypedClient) {
  return client.from("videos").select("*", { count: "exact", head: true });
}

export function getVideoById(client: TypedClient, id: number) {
  return client.from("videos").select("*").eq("id", id).single();
}

export function listVideosByCategory(client: TypedClient, categoryId: number) {
  return client
    .from("videos")
    .select("id, display_order")
    .eq("category_id", categoryId)
    .order("display_order");
}

export function updateVideoOrder(client: TypedClient, id: number, displayOrder: number) {
  return client.from("videos").update({ display_order: displayOrder }).eq("id", id);
}
