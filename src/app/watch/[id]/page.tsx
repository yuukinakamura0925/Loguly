import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublishedVideoById, getViewLog, getProfileRole, listPublishedVideosByCategory } from "@/lib/db";
import VideoPlayer from "./video-player";
import VideoNavigation from "./video-navigation";
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

  // member以外はアクセス不可
  const { data: profile } = await getProfileRole(supabase, user.id);
  if (profile?.role === "platform_admin") {
    redirect("/admin");
  }
  if (profile?.role === "org_admin") {
    redirect("/org/members");
  }

  const { data: video, error: videoError } = await getPublishedVideoById(supabase, videoId);

  if (videoError || !video) {
    notFound();
  }

  const { data: viewLog } = await getViewLog(supabase, user.id, videoId);

  // 同じカテゴリの動画を取得して前後を特定
  const { data: categoryVideos } = await listPublishedVideosByCategory(supabase, video.category_id);

  let prevVideo = null;
  let nextVideo = null;

  if (categoryVideos && categoryVideos.length > 1) {
    const currentIndex = categoryVideos.findIndex(v => v.id === videoId);
    if (currentIndex > 0) {
      prevVideo = categoryVideos[currentIndex - 1];
    }
    if (currentIndex < categoryVideos.length - 1) {
      nextVideo = categoryVideos[currentIndex + 1];
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link
            href="/dashboard"
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            &larr; 動画一覧に戻る
          </Link>
          <h1 className="text-lg font-medium text-slate-900 dark:text-white hidden sm:block">
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
            categoryName: video.categories!.name,
          }}
          initialProgress={{
            maxWatchedSeconds: viewLog?.max_watched_seconds || 0,
            completed: viewLog?.completed || false,
          }}
          userId={user.id}
        />

        {/* 前後の動画ナビゲーション */}
        {(prevVideo || nextVideo) && (
          <VideoNavigation
            categoryName={video.categories!.name}
            prevVideo={prevVideo ? { id: prevVideo.id, title: prevVideo.title } : null}
            nextVideo={nextVideo ? { id: nextVideo.id, title: nextVideo.title } : null}
          />
        )}
      </main>
    </div>
  );
}
