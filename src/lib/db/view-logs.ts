import type { TypedClient } from "./types";

export function getViewLogsByUser(client: TypedClient, userId: string) {
  return client.from("view_logs").select("*").eq("user_id", userId);
}

export function getViewLog(client: TypedClient, userId: string, videoId: number) {
  return client
    .from("view_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("video_id", videoId)
    .single();
}

export function getViewLogsByUsers(client: TypedClient, userIds: string[]) {
  return client
    .from("view_logs")
    .select("user_id, video_id, max_watched_seconds, completed")
    .in("user_id", userIds.length > 0 ? userIds : ["__none__"]);
}

export function upsertViewLog(
  client: TypedClient,
  data: {
    user_id: string;
    video_id: number;
    max_watched_seconds: number;
    completed: boolean;
    completed_at: string | null;
  }
) {
  return client.from("view_logs").upsert(data, { onConflict: "user_id,video_id" });
}
