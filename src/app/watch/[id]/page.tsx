import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  // 動画情報を取得
  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("*, categories(name)")
    .eq("id", videoId)
    .eq("is_published", true)
    .single();

  if (videoError || !video) {
    notFound();
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
            ← 動画一覧に戻る
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
