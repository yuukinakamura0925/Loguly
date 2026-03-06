import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole, getCurrentOrg } from "@/lib/auth";
import { listLicensedVideosForOrg, listCategories } from "@/lib/db";
import { Card, CardContent } from "@/components/ui";

type Video = {
  id: number;
  title: string;
  duration: number;
  display_order: number;
  categories: { name: string } | null;
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function OrgVideosPage() {
  await requireRole("org_admin");
  const org = await getCurrentOrg();
  if (!org) return null;

  const supabase = await createClient();
  const [{ data: licenses }, { data: categories }] = await Promise.all([
    listLicensedVideosForOrg(supabase, org.id),
    listCategories(supabase),
  ]);

  const videos: Video[] =
    licenses
      ?.map((l) => l.videos as unknown as Video)
      .filter(Boolean)
      .sort((a, b) => a.display_order - b.display_order) || [];

  // カテゴリ別にグループ化
  const categoryMap = new Map<string, Video[]>();
  for (const video of videos) {
    const catName = video.categories?.name || "未分類";
    if (!categoryMap.has(catName)) {
      categoryMap.set(catName, []);
    }
    categoryMap.get(catName)!.push(video);
  }

  // カテゴリのdisplay_order順に並べる
  const categoryOrder = new Map(
    categories?.map((c) => [c.name, c.display_order]) || []
  );
  const sortedCategories = [...categoryMap.entries()].sort(
    (a, b) => (categoryOrder.get(a[0]) ?? 999) - (categoryOrder.get(b[0]) ?? 999)
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">動画プレビュー</h1>
        <p className="text-sm text-slate-500 mt-1">
          ライセンス済みの動画を確認できます（{videos.length}本）
        </p>
      </div>

      {sortedCategories.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-slate-500 text-center py-8">
              ライセンスされた動画がありません
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedCategories.map(([categoryName, categoryVideos]) => (
            <div key={categoryName}>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                {categoryName}
                <span className="ml-2 text-slate-400 font-normal">
                  {categoryVideos.length}本
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categoryVideos.map((video) => (
                  <Link
                    key={video.id}
                    href={`/org/videos/${video.id}`}
                    className="group"
                  >
                    <Card className="transition-all group-hover:ring-2 group-hover:ring-da-blue-900/20 dark:group-hover:ring-da-blue-300/20">
                      <CardContent className="flex items-center gap-4 py-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-slate-400 group-hover:text-da-blue-900 dark:group-hover:text-da-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {video.title}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatDuration(video.duration)}
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-slate-400 group-hover:text-da-blue-900 dark:group-hover:text-da-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
