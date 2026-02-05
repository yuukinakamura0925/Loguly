import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth";
import LogoutButton from "./logout-button";

type Category = {
  id: number;
  name: string;
  display_order: number;
};

type Video = {
  id: number;
  category_id: number;
  title: string;
  description: string | null;
  duration: number;
  display_order: number;
};

type ViewLog = {
  video_id: number;
  max_watched_seconds: number;
  completed: boolean;
};

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function getStatusIcon(video: Video, viewLog?: ViewLog): { icon: string; text: string; color: string } {
  if (!viewLog) {
    return { icon: "○", text: "未視聴", color: "text-gray-400" };
  }
  if (viewLog.completed) {
    return { icon: "✓", text: "完了", color: "text-green-500" };
  }
  const progress = Math.round((viewLog.max_watched_seconds / video.duration) * 100);
  return { icon: "▶", text: `${progress}%`, color: "text-yellow-500" };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // プロフィール情報を取得
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 組織情報を取得
  const org = await getCurrentOrg();

  // カテゴリ一覧を取得
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("display_order");

  // 公開済み動画一覧を取得（RLSでライセンスのある動画のみ返る）
  const { data: videos } = await supabase
    .from("videos")
    .select("*")
    .eq("is_published", true)
    .order("display_order");

  // 視聴ログを取得
  const { data: viewLogs } = await supabase
    .from("view_logs")
    .select("*")
    .eq("user_id", user.id);

  // カテゴリごとの進捗を計算
  const getCategoryProgress = (categoryId: number) => {
    const categoryVideos = videos?.filter((v) => v.category_id === categoryId) || [];
    if (categoryVideos.length === 0) return 0;
    const completed = categoryVideos.filter((v) =>
      viewLogs?.find((log) => log.video_id === v.id && log.completed)
    ).length;
    return Math.round((completed / categoryVideos.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {org ? org.name : "Loguly"}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {profile?.display_name || user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {categories?.map((category: Category) => {
            const categoryVideos = videos?.filter(
              (v: Video) => v.category_id === category.id
            ) || [];
            const progress = getCategoryProgress(category.id);

            if (categoryVideos.length === 0) return null;

            return (
              <div
                key={category.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {category.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {progress}%
                    </span>
                  </div>
                </div>

                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {categoryVideos.map((video: Video) => {
                    const viewLog = viewLogs?.find(
                      (log: ViewLog) => log.video_id === video.id
                    );
                    const status = getStatusIcon(video, viewLog);

                    return (
                      <li key={video.id}>
                        <Link
                          href={`/watch/${video.id}`}
                          className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className={`text-xl ${status.color}`}>
                                {status.icon}
                              </span>
                              <div>
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {video.title}
                                </h3>
                                {video.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {video.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDuration(video.duration)}
                              </span>
                              <span className={`text-sm ${status.color}`}>
                                {status.text}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
