import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth";
import {
  getProfileById,
  listCategories,
  listLicensedVideosForOrg,
  listOrgCategoryOrder,
  getViewLogsByUser,
} from "@/lib/db";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { SettingsIcon } from "@/components/icons";
import LogoutButton from "./logout-button";
import { ProgressOverview } from "./components/progress-overview";
import { CategorySection } from "./components/category-section";

type Category = {
  id: number;
  name: string;
  display_order: number;
};

type ViewLog = {
  video_id: number;
  max_watched_seconds: number;
  completed: boolean;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await getProfileById(supabase, user.id);

  if (profile?.role === "platform_admin") {
    redirect("/admin");
  }
  if (profile?.role === "org_admin") {
    redirect("/org/members");
  }
  const org = await getCurrentOrg();
  const orgId = org?.id;

  const [{ data: categories }, licensesResult, { data: orgCatOrders }, { data: viewLogs }] =
    await Promise.all([
      listCategories(supabase),
      orgId ? listLicensedVideosForOrg(supabase, orgId) : Promise.resolve({ data: null }),
      orgId ? listOrgCategoryOrder(supabase, orgId) : Promise.resolve({ data: null }),
      getViewLogsByUser(supabase, user.id),
    ]);

  // 組織別カテゴリ順マップ
  const orgCatOrderMap = new Map(
    (orgCatOrders || []).map((o: { category_id: number; display_order: number }) => [o.category_id, o.display_order])
  );

  // 割り当て済み動画を展開（組織別表示順を保持）
  type DashboardVideo = { id: number; category_id: number; title: string; description: string | null; duration: number; display_order: number; orgDisplayOrder: number | null };
  const videos: DashboardVideo[] = (licensesResult?.data || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((l: any) => {
      const v = l.videos;
      if (!v) return null;
      return {
        id: v.id,
        category_id: v.category_id,
        title: v.title,
        description: v.description ?? null,
        duration: v.duration,
        display_order: v.display_order,
        orgDisplayOrder: l.display_order as number | null,
      };
    })
    .filter(Boolean) as DashboardVideo[];

  // カテゴリ別の進捗率（視聴時間ベース）
  const getCategoryProgress = (categoryId: number) => {
    const categoryVideos = videos.filter((v) => v.category_id === categoryId);
    if (categoryVideos.length === 0) return 0;

    const totalDuration = categoryVideos.reduce((acc, v) => acc + v.duration, 0);
    let watched = 0;
    for (const video of categoryVideos) {
      const log = viewLogs?.find((l) => l.video_id === video.id);
      if (log) {
        watched += Math.min(log.max_watched_seconds, video.duration);
      }
    }
    return totalDuration > 0 ? Math.round((watched / totalDuration) * 100) : 0;
  };

  // 全体の進捗（視聴時間ベース）
  const totalSeconds = videos.reduce((acc, v) => acc + v.duration, 0);
  let watchedSeconds = 0;
  for (const video of videos) {
    const log = viewLogs?.find((l) => l.video_id === video.id);
    if (log) {
      watchedSeconds += Math.min(log.max_watched_seconds, video.duration);
    }
  }

  const totalVideos = videos.length;
  const completedVideos = viewLogs?.filter((log) => log.completed).length || 0;

  // カテゴリをソート（組織順 → グローバル順）
  const sortedCategories = (categories || [])
    .filter((cat: Category) => videos.some((v) => v.category_id === cat.id))
    .sort((a: Category, b: Category) => {
      const aOrder = orgCatOrderMap.get(a.id) ?? a.display_order;
      const bOrder = orgCatOrderMap.get(b.id) ?? b.display_order;
      return aOrder - bOrder;
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/settings" title="アカウント設定">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="" width={32} height={32} className="w-8 h-8 rounded-lg object-cover hover:opacity-80 transition-opacity" />
              ) : (
                <Logo size="sm" showText={false} />
              )}
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">{org ? org.name : "Loguly"}</h1>
              <p className="text-xs text-slate-500">{profile?.display_name || user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="設定"
            >
              <SettingsIcon className="w-5 h-5" />
            </Link>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Progress Overview */}
        <div className="mb-8">
          <ProgressOverview
            watchedSeconds={watchedSeconds}
            totalSeconds={totalSeconds}
            completedVideos={completedVideos}
            totalVideos={totalVideos}
          />
        </div>

        {/* Categories */}
        <div className="space-y-6">
          {sortedCategories.map((category: Category) => {
            const categoryVideos = videos
              .filter((v) => v.category_id === category.id)
              .sort((a, b) => {
                const aOrder = a.orgDisplayOrder ?? a.display_order;
                const bOrder = b.orgDisplayOrder ?? b.display_order;
                return aOrder - bOrder;
              });

            return (
              <CategorySection
                key={category.id}
                name={category.name}
                videos={categoryVideos}
                viewLogs={viewLogs || []}
                progress={getCategoryProgress(category.id)}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}
