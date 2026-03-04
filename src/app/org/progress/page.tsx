import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole, getCurrentOrg } from "@/lib/auth";
import {
  listOrgMemberProfiles,
  listLicensedVideosForOrg,
  getViewLogsByUsers,
} from "@/lib/db";
import { SearchInput } from "@/components/ui";
import { CheckCircleIcon, ChevronRightIcon } from "@/components/icons";

type MemberProgress = {
  user_id: string;
  display_name: string;
  email: string;
  completedCount: number;
  totalCount: number;
  watchedPercent: number; // 実際の視聴進捗（%）
};

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const search = params.q?.toLowerCase() || "";
  await requireRole("org_admin");
  const org = await getCurrentOrg();
  if (!org) return null;

  const supabase = await createClient();

  const { data: members } = await listOrgMemberProfiles(supabase, org.id);
  const { data: licenses } = await listLicensedVideosForOrg(supabase, org.id);

  const videos =
    licenses
      ?.map((l) => l.videos as unknown as { id: number; duration: number })
      .filter(Boolean) || [];

  const memberIds = members?.map((m) => m.user_id) || [];
  const { data: viewLogs } = await getViewLogsByUsers(supabase, memberIds);

  // 全動画の合計時間
  const totalDuration = videos.reduce((acc, v) => acc + (v.duration || 0), 0);

  const allProgressData: MemberProgress[] =
    members?.map((m) => {
      const profile = m.profiles as unknown as {
        display_name: string;
        email: string;
      };

      // この人の視聴ログ
      const memberLogs = viewLogs?.filter((l) => l.user_id === m.user_id) || [];

      // 完了数
      const completedCount = videos.filter((v) =>
        memberLogs.some((l) => l.video_id === v.id && l.completed)
      ).length;

      // 視聴済み秒数の合計（各動画のdurationを超えないようにする）
      let totalWatched = 0;
      for (const video of videos) {
        const log = memberLogs.find((l) => l.video_id === video.id);
        if (log) {
          totalWatched += Math.min(log.max_watched_seconds, video.duration || 0);
        }
      }

      // 視聴進捗率（全動画の合計時間に対する視聴済み時間の割合）
      const watchedPercent = totalDuration > 0
        ? Math.round((totalWatched / totalDuration) * 100)
        : 0;

      return {
        user_id: m.user_id,
        display_name: profile?.display_name || "",
        email: profile?.email || "",
        completedCount,
        totalCount: videos.length,
        watchedPercent,
      };
    }) || [];

  // 検索フィルタ
  const progressData = search
    ? allProgressData.filter(
        (m) =>
          m.display_name.toLowerCase().includes(search) ||
          m.email.toLowerCase().includes(search)
      )
    : allProgressData;

  // 統計（検索フィルタ前の全データで計算）
  const totalMembers = allProgressData.length;
  const totalVideos = videos.length;
  const avgProgress = allProgressData.length > 0
    ? Math.round(allProgressData.reduce((acc, m) => acc + m.watchedPercent, 0) / allProgressData.length)
    : 0;
  const fullyCompletedMembers = allProgressData.filter((m) => m.completedCount === m.totalCount && m.totalCount > 0).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">視聴進捗</h1>

      {videos.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500">
          ライセンスのある動画がありません
        </div>
      ) : (
        <>
          {/* 統計サマリー */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalMembers}</div>
              <div className="text-sm text-slate-500">メンバー</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalVideos}</div>
              <div className="text-sm text-slate-500">動画数</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-2xl font-bold text-da-success dark:text-emerald-400">{fullyCompletedMembers}</div>
              <div className="text-sm text-slate-500">全完了者</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-2xl font-bold text-da-blue-900 dark:text-da-blue-300">{avgProgress}%</div>
              <div className="text-sm text-slate-500">平均進捗</div>
            </div>
          </div>

          {/* 検索 */}
          <div className="mb-4">
            <SearchInput placeholder="名前・メールで検索..." paramName="q" className="max-w-sm" />
          </div>

          {/* メンバー一覧 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                メンバー別進捗 {search && `(${progressData.length}件)`}
              </h2>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {progressData.map((member) => {
                const isFullyCompleted = member.completedCount === member.totalCount && member.totalCount > 0;

                return (
                  <Link
                    key={member.user_id}
                    href={`/org/progress/${member.user_id}`}
                    className={`flex items-center gap-4 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      isFullyCompleted ? "bg-emerald-50 dark:bg-emerald-900/10" : ""
                    }`}
                  >
                    {/* アバター */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      isFullyCompleted
                        ? "bg-da-blue-900 text-white"
                        : "bg-slate-500 dark:bg-slate-600"
                    }`}>
                      {member.display_name?.charAt(0) || "?"}
                    </div>

                    {/* 名前・メール */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 dark:text-white font-medium truncate">
                          {member.display_name}
                        </span>
                        {isFullyCompleted && (
                          <CheckCircleIcon className="w-4 h-4 text-da-success flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-slate-500 text-sm truncate">{member.email}</div>
                    </div>

                    {/* 進捗 */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          isFullyCompleted
                            ? "text-da-success dark:text-emerald-400"
                            : member.watchedPercent > 0
                              ? "text-da-blue-900 dark:text-da-blue-300"
                              : "text-slate-400"
                        }`}>
                          {member.watchedPercent}%
                        </div>
                        <div className="text-xs text-slate-500">
                          {member.completedCount}/{member.totalCount} 完了
                        </div>
                      </div>

                      {/* プログレスバー */}
                      <div className="w-24 hidden sm:block">
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isFullyCompleted
                                ? "bg-da-success"
                                : member.watchedPercent > 0
                                  ? "bg-da-blue-900"
                                  : "bg-slate-300 dark:bg-slate-600"
                            }`}
                            style={{ width: `${member.watchedPercent}%` }}
                          />
                        </div>
                      </div>

                      <ChevronRightIcon className="w-5 h-5 text-slate-400" />
                    </div>
                  </Link>
                );
              })}
              {progressData.length === 0 && (
                <div className="px-4 py-8 text-center text-slate-500">
                  {search ? "検索結果がありません" : "メンバーがいません"}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
