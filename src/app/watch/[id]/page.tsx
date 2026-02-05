import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth";
import VideoPlayer from "./video-player";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function WatchPage({ params }: Props) {
  const { id } = await params;
  const videoId = parseInt(id, 10);

  if (isNaN(videoId)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 動画情報を取得（RLSでライセンスチェック済み）
  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("*, categories(name)")
    .eq("id", videoId)
    .eq("is_published", true)
    .single();

  if (videoError || !video) {
    notFound();
  }

  // 視聴人数制限チェック
  const org = await getCurrentOrg();
  if (org) {
    const { data: license } = await supabase
      .from("organization_licenses")
      .select("max_viewers")
      .eq("organization_id", org.id)
      .eq("video_id", videoId)
      .eq("is_active", true)
      .single();

    if (license && license.max_viewers > 0) {
      // 自分が既に視聴済みか確認
      const { data: existingLog } = await supabase
        .from("view_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("video_id", videoId)
        .maybeSingle();

      if (!existingLog) {
        // 組織内の視聴者数をカウント
        const { data: orgMembers } = await supabase
          .from("organization_members")
          .select("user_id")
          .eq("organization_id", org.id);

        const memberIds = orgMembers?.map((m) => m.user_id) || [];

        const { count } = await supabase
          .from("view_logs")
          .select("*", { count: "exact", head: true })
          .eq("video_id", videoId)
          .in("user_id", memberIds.length > 0 ? memberIds : ["none"]);

        if ((count ?? 0) >= license.max_viewers) {
          return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
              <div className="bg-gray-800 rounded-lg p-8 max-w-md text-center">
                <div className="text-4xl mb-4">&#x1f6ab;</div>
                <h1 className="text-xl font-bold text-white mb-2">
                  視聴人数の上限に達しています
                </h1>
                <p className="text-gray-400 mb-6">
                  この動画の視聴可能人数（{license.max_viewers}人）に達しているため、現在視聴できません。組織の管理者にお問い合わせください。
                </p>
                <Link
                  href="/dashboard"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  動画一覧に戻る
                </Link>
              </div>
            </div>
          );
        }
      }
    }
  }

  // 視聴ログを取得（なければnull）
  const { data: viewLog } = await supabase
    .from("view_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("video_id", videoId)
    .single();

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-white transition-colors"
          >
            &larr; 動画一覧に戻る
          </Link>
          <h1 className="text-lg font-medium text-white">
            {video.title}
          </h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <VideoPlayer
          video={{
            id: video.id,
            title: video.title,
            description: video.description,
            duration: video.duration,
            cfVideoId: video.cf_video_id,
            categoryName: video.categories?.name,
          }}
          initialProgress={{
            maxWatchedSeconds: viewLog?.max_watched_seconds || 0,
            completed: viewLog?.completed || false,
          }}
          userId={user.id}
        />
      </main>
    </div>
  );
}
