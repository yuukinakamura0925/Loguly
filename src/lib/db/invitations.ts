import type { TypedClient } from "./types";

export function getValidInvitationByToken(client: TypedClient, token: string) {
  return client
    .from("invitations")
    .select("*, organizations(name)")
    .eq("token", token)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();
}

export function findPendingInvitation(
  client: TypedClient,
  organizationId: string,
  email: string
) {
  return client
    .from("invitations")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("email", email)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
}

export function listPendingInvitations(client: TypedClient, organizationId: string) {
  return client
    .from("invitations")
    .select("id, email, role, expires_at")
    .eq("organization_id", organizationId)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
}

export function insertInvitation(
  client: TypedClient,
  data: {
    organization_id: string;
    email: string;
    role: string;
    token: string;
    invited_by: string;
    expires_at: string;
  }
) {
  return client.from("invitations").insert(data);
}

export function deleteInvitation(client: TypedClient, id: string) {
  return client.from("invitations").delete().eq("id", id);
}
