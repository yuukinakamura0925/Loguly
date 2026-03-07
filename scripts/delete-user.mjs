import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const envContent = readFileSync(".env.local", "utf8");
function env(key) {
  const match = envContent.match(new RegExp(`^${key}=(.+)$`, "m"));
  return match ? match[1].trim() : undefined;
}

const c = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

const email = "gimata01@gmail.com";

const { data: { users } } = await c.auth.admin.listUsers();
const user = users.find((u) => u.email === email);

if (!user) {
  console.log("User not found:", email);
  process.exit(1);
}

console.log("User:", user.id, user.email);

// Get org membership
const { data: members } = await c
  .from("organization_members")
  .select("organization_id, role")
  .eq("user_id", user.id);
console.log("Memberships:", members);

let orgId = null;
if (members && members.length > 0) {
  orgId = members[0].organization_id;
  const { data: org } = await c
    .from("organizations")
    .select("id, name")
    .eq("id", orgId)
    .single();
  console.log("Organization:", org);
}

// Delete: organization_members -> profiles -> auth.users -> organization
console.log("\n--- Deleting ---");

const { error: memErr } = await c
  .from("organization_members")
  .delete()
  .eq("user_id", user.id);
console.log("Delete org member:", memErr || "OK");

const { error: profErr } = await c
  .from("profiles")
  .delete()
  .eq("id", user.id);
console.log("Delete profile:", profErr || "OK");

const { error: authErr } = await c.auth.admin.deleteUser(user.id);
console.log("Delete auth user:", authErr || "OK");

if (orgId) {
  // Check if any other members remain
  const { data: remaining } = await c
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", orgId);

  if (!remaining || remaining.length === 0) {
    // Delete org licenses too
    const { error: licErr } = await c
      .from("organization_licenses")
      .delete()
      .eq("organization_id", orgId);
    console.log("Delete org licenses:", licErr || "OK");

    const { error: orgErr } = await c
      .from("organizations")
      .delete()
      .eq("id", orgId);
    console.log("Delete organization:", orgErr || "OK");
  } else {
    console.log("Organization has other members, not deleting org");
  }
}

console.log("\nDone!");
