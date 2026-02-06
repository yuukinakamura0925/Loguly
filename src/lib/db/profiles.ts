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
