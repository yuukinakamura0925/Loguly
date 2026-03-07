import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  countOrganizations,
  countVideos,
  countCategories,
  countLicenses,
  listOrganizations,
  listVideosWithCategory,
} from "@/lib/db";
import { BuildingIcon, VideoIcon, TagIcon, KeyIcon, ChevronRightIcon } from "@/components/icons";

const statIcons = {
  organizations: <BuildingIcon className="w-6 h-6" strokeWidth={1.5} />,
  videos: <VideoIcon className="w-6 h-6" strokeWidth={1.5} />,
  categories: <TagIcon className="w-6 h-6" strokeWidth={1.5} />,
  licenses: <KeyIcon className="w-6 h-6" strokeWidth={1.5} />,
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: orgCount },
    { count: videoCount },
    { count: categoryCount },
    { count: licenseCount },
    { data: recentOrgs },
    { data: recentVideos },
  ] = await Promise.all([
    countOrganizations(supabase),
    countVideos(supabase),
    countCategories(supabase),
    countLicenses(supabase),
    listOrganizations(supabase).limit(5),
    listVideosWithCategory(supabase).order("created_at", { ascending: false }).limit(5),
  ]);

  const stats = [
    { key: "organizations", label: "組織数", value: orgCount ?? 0, href: "/admin/organizations" },
    { key: "videos", label: "動画数", value: videoCount ?? 0, href: "/admin/videos" },
    { key: "categories", label: "カテゴリ数", value: categoryCount ?? 0, href: "/admin/categories" },
    { key: "licenses", label: "割り当て数", value: licenseCount ?? 0, href: "/admin/licenses" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">ダッシュボード</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">システム全体の概要</p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stats Cards — top row */}
        {stats.map((stat, index) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/60 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group animate-card-enter"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700/50">
                <span className="text-slate-600 dark:text-slate-400">
                  {statIcons[stat.key as keyof typeof statIcons]}
                </span>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
            </div>
            <div className="text-4xl font-extrabold tracking-tighter text-slate-900 dark:text-white mb-1">{stat.value}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
          </Link>
        ))}

        {/* Recent Organizations — spans 2 cols on lg */}
        <div className="sm:col-span-2 lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden animate-card-enter" style={{ animationDelay: "320ms" }}>
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

        {/* Recent Videos — spans 2 cols on lg */}
        <div className="sm:col-span-2 lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden animate-card-enter" style={{ animationDelay: "400ms" }}>
          <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">最近の動画</h2>
            <Link href="/admin/videos" className="text-sm text-da-blue-900 dark:text-da-blue-300 hover:text-da-blue-1000">
              すべて表示 →
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentVideos && recentVideos.length > 0 ? (
              recentVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">{video.title}</div>
                    <div className="text-xs text-slate-500">
                      {(video.categories as { name: string } | null)?.name ?? "未分類"} · {Math.floor(video.duration / 60)}分{video.duration % 60}秒
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    video.is_published
                      ? "bg-emerald-100 text-da-success dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}>
                    {video.is_published ? "公開" : "非公開"}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-slate-500">
                動画がありません
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions — full width */}
        <div className="sm:col-span-2 lg:col-span-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-6 animate-card-enter" style={{ animationDelay: "480ms" }}>
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">クイックアクション</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/admin/organizations", label: "組織を追加", icon: statIcons.organizations },
              { href: "/admin/videos", label: "動画を追加", icon: statIcons.videos },
              { href: "/admin/categories", label: "カテゴリを追加", icon: statIcons.categories },
              { href: "/admin/licenses", label: "動画を割り当て", icon: statIcons.licenses },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-da-blue-50 dark:hover:bg-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-da-blue-900 dark:hover:text-white transition-all group"
              >
                <span className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm group-hover:shadow-md transition-shadow">
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
