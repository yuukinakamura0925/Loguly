import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const envContent = readFileSync(".env.local", "utf8");
function env(key) {
  const match = envContent.match(new RegExp(`^${key}=(.+)$`, "m"));
  return match ? match[1].trim() : undefined;
}

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log("Usage: node scripts/reset-password.mjs <email> <new-password>");
  process.exit(1);
}

const c = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

const { data: { users } } = await c.auth.admin.listUsers();
const user = users.find((u) => u.email === email);

if (!user) {
  console.log("User not found:", email);
  process.exit(1);
}

const { error } = await c.auth.admin.updateUserById(user.id, { password: newPassword });

if (error) {
  console.error("Failed:", error.message);
  process.exit(1);
}

console.log("Password updated for", email);
