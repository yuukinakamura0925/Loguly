import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const { Client } = pg;

// .env.local から読み取り
const envContent = readFileSync(".env.local", "utf8");
function env(key) {
  const match = envContent.match(new RegExp(`^${key}=(.+)$`, "m"));
  return match ? match[1].trim() : null;
}

const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
const databaseUrl = env("DATABASE_URL");

if (!supabaseUrl || !serviceRoleKey || !databaseUrl) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL が必要です");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = process.argv[2] || "admin@loguly.dev";
const password = process.argv[3] || "password123";

const dbClient = new Client({ connectionString: databaseUrl });

try {
  await dbClient.connect();

  // handle_new_user() の search_path を修正（トリガーエラー防止）
  const fixTriggerSQL = readFileSync("supabase/migrations/20250601000000_initial_schema.sql", "utf8");
  const fnMatch = fixTriggerSQL.match(/CREATE OR REPLACE FUNCTION handle_new_user\(\)[\s\S]*?LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;/);
  if (fnMatch) {
    await dbClient.query(fnMatch[0]);
    console.log("✓ handle_new_user() を修正しました");
  }

  await dbClient.end();
} catch (err) {
  console.error("トリガー修正エラー:", err.message);
  // 続行を試みる
  try { await dbClient.end(); } catch (_) {}
}

// ユーザー作成
const { data, error: authError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { display_name: "Platform Admin" },
});

if (authError) {
  if (authError.message.includes("already been registered")) {
    console.log(`✓ ${email} は既に存在します`);
    process.exit(0);
  }
  console.error("ユーザー作成エラー:", authError.message);
  process.exit(1);
}

// handle_new_user() トリガーが profile を作成済み → role を platform_admin に更新
const { error: updateError } = await admin
  .from("profiles")
  .update({ role: "platform_admin" })
  .eq("id", data.user.id);

if (updateError) {
  console.error("プロフィール更新エラー:", updateError.message);
  process.exit(1);
}

console.log(`✓ platform_admin を作成しました: ${email} / ${password}`);
