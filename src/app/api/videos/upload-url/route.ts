/**
 * 動画アップロードURL生成 API Route
 *
 * Server Actions ではなく API Route を使う理由:
 * - Server Actions はフォーム送信用で、JSONレスポンスを返すのが本来の用途と異なる
 * - アップロードURLを取得 → ブラウザから直接ストレージにPUT という2段階の
 *   非同期処理には、明示的なAPIエンドポイントの方が合っている
 *
 * 流れ: ブラウザ → この API → R2/Stream から署名付きURL取得 → ブラウザに返す
 *       ブラウザ → 署名付きURLに動画を直接PUT（このサーバーを経由しない）
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/db";
import { getVideoStorage } from "@/lib/video-storage";

export async function POST(request: Request) {
  // API Routeでは requireRole() が使えない（redirectするため）
  // 代わりに手動で認証・認可チェック
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await getProfileById(supabase, user.id);
  if (!profile || profile.role !== "platform_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { filename } = await request.json();
  if (!filename || typeof filename !== "string") {
    return NextResponse.json(
      { error: "filename is required" },
      { status: 400 }
    );
  }

  const storage = getVideoStorage();
  const result = await storage.createUploadUrl(filename);

  // { videoId: "videos/uuid-filename.mp4", uploadUrl: "https://..." }
  return NextResponse.json(result);
}
