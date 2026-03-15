import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  countOrganizations,
  countVideos,
  countCategories,
  countLicenses,
  listOrganizations,
  listVideosWithCategory,
  getOrgProgressSummaries,
  getExpiringLicenses,
  getVideoCompletionRanking,
  getVideoCompletionCounts,
  getDailyViewActivity,
  getGalleryStats,
  countAllMembers,
  getThisMonthGrowth,
  getOverallCompletionAndActivity,
  getSparklineData,
} from "@/lib/db";
import {
  BuildingIcon,
  VideoIcon,
  TagIcon,
  KeyIcon,
  ChevronRightIcon,
  UsersIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  TrophyIcon,
  ImageIcon,
  FolderIcon,
  HardDriveIcon,
  CheckCircleIcon,
} from "@/components/icons";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

/** SVG スパークライン */
function Sparkline({ data, color = "#3b82f6" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 80;
  const h = 24;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

const cardBase = "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-slate-800/60";
const cardHover = "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: orgCount },
    { count: videoCount },
    { count: categoryCount },
    { count: licenseCount },
    { data: recentOrgs },
    { data: recentVideos },
    orgProgress,
    expiringLicenses,
    videoRanking,
    completionCounts,
    dailyActivity,
    galleryStats,
    memberCount,
    growth,
    completionActivity,
    orgSparkline,
    memberSparkline,
  ] = await Promise.all([
    countOrganizations(supabase),
    countVideos(supabase),
    countCategories(supabase),
    countLicenses(supabase),
    listOrganizations(supabase).limit(5),
    listVideosWithCategory(supabase).order("created_at", { ascending: false }).limit(5),
    getOrgProgressSummaries(supabase),
    getExpiringLicenses(supabase),
    getVideoCompletionRanking(supabase),
    getVideoCompletionCounts(supabase),
    getDailyViewActivity(supabase),
    getGalleryStats(supabase),
    countAllMembers(supabase),
    getThisMonthGrowth(supabase),
    getOverallCompletionAndActivity(supabase),
    getSparklineData(supabase, "organizations", "created_at"),
    getSparklineData(supabase, "organization_members", "joined_at"),
  ]);

  const activeOrgCount = orgProgress.length;
  const maxActivity = Math.max(...dailyActivity.map((d) => d.count), 1);
  const expiredCount = expiringLicenses.filter((l) => l.isExpired).length;
  const soonCount = expiringLicenses.length - expiredCount;
  const activeRate = memberCount > 0 ? Math.round((completionActivity.activeUsersLast7Days / memberCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">ダッシュボード</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">システム全体の概要</p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* ── 統計カード 1: 組織数 ── */}
        <Link href="/admin/organizations" className={`${cardBase} ${cardHover} p-6 animate-card-enter`}>
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30">
              <BuildingIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
            </div>
            <Sparkline data={orgSparkline} color="#3b82f6" />
          </div>
          <div className="text-3xl font-extrabold tracking-tighter text-slate-900 dark:text-white">{orgCount ?? 0}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">組織数</div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 dark:text-slate-500">
            <span>{activeOrgCount} 有効</span>
            <span>·</span>
            <span>今月 +{growth.newOrgs}</span>
          </div>
        </Link>

        {/* ── 統計カード 2: メンバー数 ── */}
        <Link href="/admin/organizations" className={`${cardBase} ${cardHover} p-6 animate-card-enter`} style={{ animationDelay: "80ms" }}>
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30">
              <UsersIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
            </div>
            <Sparkline data={memberSparkline} color="#10b981" />
          </div>
          <div className="text-3xl font-extrabold tracking-tighter text-slate-900 dark:text-white">{memberCount}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">メンバー数</div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 dark:text-slate-500">
            <span>今月 +{growth.newMembers}</span>
            <span>·</span>
            <span>アクティブ {activeRate}%</span>
          </div>
        </Link>

        {/* ── 統計カード 3: 動画・カテゴリ ── */}
        <Link href="/admin/videos" className={`${cardBase} ${cardHover} p-6 animate-card-enter`} style={{ animationDelay: "160ms" }}>
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/50 dark:to-violet-900/30">
              <VideoIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" strokeWidth={1.5} />
            </div>
            <div className="flex items-center gap-1">
              <TagIcon className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
              <span className="text-sm font-bold text-slate-500">{categoryCount ?? 0}</span>
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tighter text-slate-900 dark:text-white">{videoCount ?? 0}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">動画数</div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 dark:text-slate-500">
            <span>{categoryCount ?? 0} カテゴリ</span>
            <span>·</span>
            <span>{licenseCount ?? 0} 割り当て</span>
          </div>
        </Link>

        {/* ── 統計カード 4: ライセンス数 ── */}
        <Link href="/admin/licenses" className={`${cardBase} ${cardHover} p-6 animate-card-enter`} style={{ animationDelay: "240ms" }}>
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30">
              <KeyIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
            </div>
            {expiringLicenses.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-medium">
                {expiringLicenses.length} 期限間近
              </span>
            )}
          </div>
          <div className="text-3xl font-extrabold tracking-tighter text-slate-900 dark:text-white">{licenseCount ?? 0}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">ライセンス数</div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 dark:text-slate-500">
            <span>{orgCount ?? 0} 組織に割り当て中</span>
            {expiredCount > 0 && (
              <><span>·</span><span className="text-red-500">{expiredCount} 期限切れ</span></>
            )}
          </div>
        </Link>

        {/* ── 視聴アクティビティ（7日間） ── */}
        <div className={`sm:col-span-2 ${cardBase} overflow-hidden animate-card-enter`} style={{ animationDelay: "320ms" }}>
          <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2">
            <TrendingUpIcon className="w-5 h-5 text-slate-500" strokeWidth={1.5} />
            <h2 className="font-semibold text-slate-900 dark:text-white">視聴アクティビティ</h2>
            <span className="text-xs text-slate-500 ml-auto">直近7日間</span>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-end gap-2 h-32">
              {dailyActivity.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {day.count > 0 ? day.count : ""}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-da-blue-900 to-da-blue-300 dark:from-da-blue-1000 dark:to-da-blue-300 transition-all duration-500"
                    style={{
                      height: `${Math.max((day.count / maxActivity) * 100, 4)}%`,
                      minHeight: "4px",
                    }}
                  />
                  <span className="text-[10px] text-slate-500">{day.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <UsersIcon className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                <span className="text-slate-600 dark:text-slate-400">アクティブ {completionActivity.activeUsersLast7Days}/{memberCount}名</span>
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                合計 {dailyActivity.reduce((sum, d) => sum + d.count, 0)} 視聴
              </div>
            </div>
          </div>
        </div>

        {/* ── 期限アラート ── */}
        <div className={`sm:col-span-2 ${cardBase} overflow-hidden animate-card-enter`} style={{ animationDelay: "400ms" }}>
          <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2">
            <AlertTriangleIcon className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
            <h2 className="font-semibold text-slate-900 dark:text-white">期限アラート</h2>
            {expiringLicenses.length > 0 && (
              <span className="ml-auto flex items-center gap-2 text-xs">
                {expiredCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">
                    期限切れ {expiredCount}
                  </span>
                )}
                {soonCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                    まもなく {soonCount}
                  </span>
                )}
              </span>
            )}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {expiringLicenses.length > 0 ? (
              expiringLicenses.slice(0, 5).map((lic, i) => (
                <Link
                  key={i}
                  href={`/admin/organizations/${lic.orgId}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white text-sm">{lic.orgName}</div>
                    <div className="text-xs text-slate-500">{lic.videoTitle}</div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    lic.isExpired
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}>
                    {formatDate(lic.expiresAt)}
                  </span>
                </Link>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <div className="text-emerald-500 dark:text-emerald-400 text-sm font-medium">問題ありません</div>
                <p className="text-xs text-slate-500 mt-1">30日以内に期限切れのライセンスはありません</p>
              </div>
            )}
          </div>
        </div>

        {/* ── 組織別進捗 ── */}
        <div className={`sm:col-span-2 ${cardBase} overflow-hidden animate-card-enter`} style={{ animationDelay: "480ms" }}>
          <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BuildingIcon className="w-5 h-5 text-slate-500" strokeWidth={1.5} />
              <h2 className="font-semibold text-slate-900 dark:text-white">組織別進捗</h2>
            </div>
            <Link href="/admin/organizations" className="text-sm text-da-blue-900 dark:text-da-blue-300 hover:text-da-blue-1000">
              すべて表示 →
            </Link>
          </div>
          <div className="px-6 py-4 space-y-4">
            {orgProgress.length > 0 ? (
              orgProgress.slice(0, 6).map((org) => {
                const rate = org.memberCount > 0
                  ? Math.round((org.completedMembers / org.memberCount) * 100)
                  : 0;
                return (
                  <Link key={org.id} href={`/admin/organizations/${org.id}`} className="block hover:opacity-80 transition-opacity">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-900 dark:text-white truncate mr-2">{org.name}</span>
                      <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                        <span>{org.completedMembers}/{org.memberCount}名完了</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{rate}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          rate === 100
                            ? "bg-gradient-to-r from-amber-400 to-yellow-500"
                            : rate > 50
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                            : rate > 0
                            ? "bg-gradient-to-r from-da-blue-900 to-da-blue-300"
                            : "bg-slate-200 dark:bg-slate-700"
                        }`}
                        style={{ width: `${Math.max(rate, 0)}%` }}
                      />
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="py-4 text-center text-slate-500 text-sm">
                組織がありません
              </div>
            )}
          </div>
        </div>

        {/* ── 完了ランキング ── */}
        <div className={`${cardBase} overflow-hidden animate-card-enter`} style={{ animationDelay: "560ms" }}>
          <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
            <h2 className="font-semibold text-slate-900 dark:text-white">完了ランキング</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {videoRanking.length > 0 ? (
              videoRanking.map((video, i) => (
                <Link key={video.id} href={`/admin/videos/${video.id}`} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : i === 1
                      ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                      : i === 2
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{video.title}</div>
                  </div>
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                    {video.completions}
                  </span>
                </Link>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-slate-500 text-sm">
                データなし
              </div>
            )}
          </div>
        </div>

        {/* ── 画像保管庫 ── */}
        <Link
          href="/admin/gallery"
          className={`${cardBase} ${cardHover} overflow-hidden animate-card-enter`}
          style={{ animationDelay: "640ms" }}
        >
          <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2">
            <HardDriveIcon className="w-5 h-5 text-slate-500" strokeWidth={1.5} />
            <h2 className="font-semibold text-slate-900 dark:text-white">画像保管庫</h2>
            <ChevronRightIcon className="w-4 h-4 text-slate-400 ml-auto group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="text-3xl font-extrabold tracking-tighter text-slate-900 dark:text-white">
              {formatBytes(galleryStats.totalBytes)}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <ImageIcon className="w-4 h-4" strokeWidth={1.5} />
                <span>{galleryStats.imageCount} 画像</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <FolderIcon className="w-4 h-4" strokeWidth={1.5} />
                <span>{galleryStats.folderCount} フォルダ</span>
              </div>
            </div>
          </div>
        </Link>

        {/* ── 最近の組織 ── */}
        <div className={`sm:col-span-2 ${cardBase} overflow-hidden animate-card-enter`} style={{ animationDelay: "720ms" }}>
          <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">最近の組織</h2>
            <Link href="/admin/organizations" className="text-sm text-da-blue-900 dark:text-da-blue-300 hover:text-da-blue-1000">
              すべて表示 →
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentOrgs && recentOrgs.length > 0 ? (
              recentOrgs.map((org) => (
                <Link
                  key={org.id}
                  href={`/admin/organizations/${org.id}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">{org.name}</div>
                    <div className="text-xs text-slate-500">
                      {org.organization_members?.[0]?.count ?? 0}名 · {formatDate(org.created_at)}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    org.is_active
                      ? "bg-emerald-100 text-da-success dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    {org.is_active ? "有効" : "無効"}
                  </span>
                </Link>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-slate-500">
                組織がありません
              </div>
            )}
          </div>
        </div>

        {/* ── 最近の動画 ── */}
        <div className={`sm:col-span-2 ${cardBase} overflow-hidden animate-card-enter`} style={{ animationDelay: "800ms" }}>
          <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">最近の動画</h2>
            <Link href="/admin/videos" className="text-sm text-da-blue-900 dark:text-da-blue-300 hover:text-da-blue-1000">
              すべて表示 →
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentVideos && recentVideos.length > 0 ? (
              recentVideos.map((video) => {
                const completions = completionCounts.get(video.id) || 0;
                return (
                  <Link
                    key={video.id}
                    href={`/admin/videos/${video.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1 mr-3">
                      <div className="font-medium text-slate-900 dark:text-white truncate">{video.title}</div>
                      <div className="text-xs text-slate-500">
                        {(video.categories as { name: string } | null)?.name ?? "未分類"} · {Math.floor(video.duration / 60)}分{video.duration % 60}秒
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {completions > 0 && (
                        <span className="text-xs text-slate-500">
                          <CheckCircleIcon className="w-3.5 h-3.5 inline mr-0.5 text-emerald-500" strokeWidth={1.5} />{completions}完了
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        video.is_published
                          ? "bg-emerald-100 text-da-success dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                        {video.is_published ? "公開" : "非公開"}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="px-6 py-8 text-center text-slate-500">
                動画がありません
              </div>
            )}
          </div>
        </div>

        {/* ── クイックアクション ── */}
        <div className={`sm:col-span-2 lg:col-span-4 ${cardBase} p-6 animate-card-enter`} style={{ animationDelay: "880ms" }}>
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">クイックアクション</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { href: "/admin/organizations", label: "組織を追加", icon: <BuildingIcon className="w-5 h-5" strokeWidth={1.5} /> },
              { href: "/admin/videos", label: "動画を追加", icon: <VideoIcon className="w-5 h-5" strokeWidth={1.5} /> },
              { href: "/admin/categories", label: "カテゴリを追加", icon: <TagIcon className="w-5 h-5" strokeWidth={1.5} /> },
              { href: "/admin/licenses", label: "動画を割り当て", icon: <KeyIcon className="w-5 h-5" strokeWidth={1.5} /> },
              { href: "/admin/gallery", label: "画像を管理", icon: <ImageIcon className="w-5 h-5" strokeWidth={1.5} /> },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-da-blue-50 dark:hover:bg-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-da-blue-900 dark:hover:text-white transition-all group"
              >
                <span className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm group-hover:shadow-md transition-shadow text-slate-600 dark:text-slate-400">
                  {action.icon}
                </span>
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
