import { createClient } from "@/lib/supabase/server";
import {
  countOrganizations,
  countVideos,
  countCategories,
  countLicenses,
} from "@/lib/db";

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
    { label: "組織数", value: orgCount ?? 0 },
    { label: "動画数", value: videoCount ?? 0 },
    { label: "カテゴリ数", value: categoryCount ?? 0 },
    { label: "ライセンス数", value: licenseCount ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">ダッシュボード</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <div className="text-3xl font-bold text-white">{stat.value}</div>
            <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
