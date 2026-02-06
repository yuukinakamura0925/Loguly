import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublishedVideoById, getViewLog } from "@/lib/db";
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

  const { data: video, error: videoError } = await getPublishedVideoById(supabase, videoId);

  if (videoError || !video) {
    notFound();
  }

  const { data: viewLog } = await getViewLog(supabase, user.id, videoId);

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
          <h1 className="text-lg font-medium text-slate-900 dark:text-white">
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
