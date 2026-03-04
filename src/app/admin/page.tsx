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

const statIcons = {
  organizations: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  videos: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  categories: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  licenses: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),
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
    { key: "licenses", label: "ライセンス数", value: licenseCount ?? 0, href: "/admin/licenses" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">ダッシュボード</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">システム全体の概要</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                <span className="text-slate-600 dark:text-slate-400">
                  {statIcons[stat.key as keyof typeof statIcons]}
                </span>
              </div>
              <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="text-4xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Organizations */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">最近の組織</h2>
            <Link href="/admin/organizations" className="text-sm text-da-blue-900 dark:text-da-blue-300 hover:text-da-blue-1000 hover:underline">
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

        {/* Recent Videos */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">最近の動画</h2>
            <Link href="/admin/videos" className="text-sm text-da-blue-900 dark:text-da-blue-300 hover:text-da-blue-1000 hover:underline">
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
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">クイックアクション</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { href: "/admin/organizations", label: "組織を追加", icon: statIcons.organizations },
            { href: "/admin/videos", label: "動画を追加", icon: statIcons.videos },
            { href: "/admin/categories", label: "カテゴリを追加", icon: statIcons.categories },
            { href: "/admin/licenses", label: "ライセンスを追加", icon: statIcons.licenses },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="inline-flex items-center gap-2 px-4 py-2 bg-da-blue-900 text-white rounded-lg hover:bg-da-blue-1000 hover:underline transition-colors text-sm font-bold"
            >
              <span className="w-5 h-5 [&>svg]:w-5 [&>svg]:h-5">{action.icon}</span>
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
