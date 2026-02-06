import { createClient } from "@supabase/supabase-js";

// service_role key を使った管理者用クライアント
// ユーザー作成など Admin API の操作に使用
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
