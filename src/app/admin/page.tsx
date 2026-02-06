import { createClient } from "@/lib/supabase/server";
import {
  countOrganizations,
  countVideos,
  countCategories,
  countLicenses,
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

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: orgCount },
    { count: videoCount },
    { count: categoryCount },
    { count: licenseCount },
  ] = await Promise.all([
    countOrganizations(supabase),
    countVideos(supabase),
    countCategories(supabase),
    countLicenses(supabase),
  ]);

  const stats = [
    { key: "organizations", label: "組織数", value: orgCount ?? 0, color: "from-blue-500 to-indigo-600", iconColor: "text-blue-400" },
    { key: "videos", label: "動画数", value: videoCount ?? 0, color: "from-emerald-500 to-teal-600", iconColor: "text-emerald-400" },
    { key: "categories", label: "カテゴリ数", value: categoryCount ?? 0, color: "from-amber-500 to-orange-600", iconColor: "text-amber-400" },
    { key: "licenses", label: "ライセンス数", value: licenseCount ?? 0, color: "from-purple-500 to-pink-600", iconColor: "text-purple-400" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">ダッシュボード</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">システム全体の概要</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10`}>
                <span className={stat.iconColor}>
                  {statIcons[stat.key as keyof typeof statIcons]}
                </span>
              </div>
            </div>
            <div className="text-4xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
