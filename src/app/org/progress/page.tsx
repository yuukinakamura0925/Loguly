import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole, getCurrentOrg } from "@/lib/auth";
import {
  listOrgViewerProfiles,
  listLicensedVideosForOrg,
  getViewLogsByUsers,
} from "@/lib/db";
import { SearchInput } from "@/components/ui";
import AvatarPreview from "@/components/avatar-preview";
import { ChevronRightIcon, SortAscIcon, SortDescIcon, SortIcon, CrownIcon } from "@/components/icons";

type MemberProgress = {
  user_id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  completedCount: number;
  totalCount: number;
  watchedPercent: number;
};

type SortKey = "display_name" | "watchedPercent" | "completedCount";
type SortOrder = "asc" | "desc";

const VALID_SORT_KEYS: SortKey[] = ["display_name", "watchedPercent", "completedCount"];

function SortLink({
  label,
  sortKey,
  currentSort,
  currentOrder,
  searchParams,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentOrder: SortOrder;
  searchParams: Record<string, string>;
}) {
  const isActive = currentSort === sortKey;
  const nextOrder: SortOrder = isActive && currentOrder === "asc" ? "desc" : "asc";

  const params = new URLSearchParams(searchParams);
  params.set("sort", sortKey);
  params.set("order", nextOrder);

  return (
    <Link
      href={`/org/progress?${params.toString()}`}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
        isActive
          ? "bg-da-blue-50 dark:bg-da-blue-900/20 text-da-blue-900 dark:text-da-blue-300 font-medium"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
    >
      {label}
      {isActive
        ? currentOrder === "asc"
          ? <SortAscIcon className="w-3 h-3" />
          : <SortDescIcon className="w-3 h-3" />
        : <SortIcon className="w-3 h-3 text-slate-400" />
      }
    </Link>
  );
}

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; order?: string }>;
}) {
  const params = await searchParams;
  const search = params.q?.toLowerCase() || "";
  const sort = (VALID_SORT_KEYS.includes(params.sort as SortKey) ? params.sort : "display_name") as SortKey;
  const order = (params.order === "desc" ? "desc" : "asc") as SortOrder;

  await requireRole("org_admin");
  const org = await getCurrentOrg();
  if (!org) return null;

  const supabase = await createClient();

  let members: Awaited<ReturnType<typeof listOrgViewerProfiles>>["data"];
  {
    const result = await listOrgViewerProfiles(supabase, org.id);
    if (result.error) {
      // avatar_url カラムが未追加の場合のフォールバック
      const fallback = await supabase
        .from("organization_members")
        .select("user_id, profiles(display_name, email)")
        .eq("organization_id", org.id)
        .eq("role", "member")
        .order("joined_at");
      members = fallback.data as typeof members;
    } else {
      members = result.data;
    }
  }
  const { data: licenses } = await listLicensedVideosForOrg(supabase, org.id);

  const videos =
    licenses
      ?.map((l) => l.videos as unknown as { id: number; duration: number })
      .filter(Boolean) || [];

  const memberIds = members?.map((m) => m.user_id) || [];
  const { data: viewLogs } = await getViewLogsByUsers(supabase, memberIds);

  const totalDuration = videos.reduce((acc, v) => acc + (v.duration || 0), 0);

  const allProgressData: MemberProgress[] =
    members?.map((m) => {
      const profile = m.profiles as unknown as {
        display_name: string;
        email: string;
        avatar_url: string | null;
      };

      const memberLogs = viewLogs?.filter((l) => l.user_id === m.user_id) || [];

      const completedCount = videos.filter((v) =>
        memberLogs.some((l) => l.video_id === v.id && l.completed)
      ).length;

      let totalWatched = 0;
      for (const video of videos) {
        const log = memberLogs.find((l) => l.video_id === video.id);
        if (log) {
          totalWatched += Math.min(log.max_watched_seconds, video.duration || 0);
        }
      }

      const watchedPercent = totalDuration > 0
        ? Math.round((totalWatched / totalDuration) * 100)
        : 0;

      return {
        user_id: m.user_id,
        display_name: profile?.display_name || "",
        email: profile?.email || "",
        avatar_url: profile?.avatar_url || null,
        completedCount,
        totalCount: videos.length,
        watchedPercent,
      };
    }) || [];

  // Search filter
  const filtered = search
    ? allProgressData.filter(
        (m) =>
          m.display_name.toLowerCase().includes(search) ||
          m.email.toLowerCase().includes(search)
      )
    : allProgressData;

  // Sort
  const progressData = [...filtered].sort((a, b) => {
    const dir = order === "asc" ? 1 : -1;
    switch (sort) {
      case "display_name":
        return dir * a.display_name.localeCompare(b.display_name, "ja");
      case "watchedPercent":
        return dir * (a.watchedPercent - b.watchedPercent);
      case "completedCount":
        return dir * (a.completedCount - b.completedCount);
      default:
        return 0;
    }
  });

  // Stats (before filter)
  const totalMembers = allProgressData.length;
  const totalVideos = videos.length;
  const avgProgress = allProgressData.length > 0
    ? Math.round(allProgressData.reduce((acc, m) => acc + m.watchedPercent, 0) / allProgressData.length)
    : 0;
  const fullyCompletedMembers = allProgressData.filter((m) => m.completedCount === m.totalCount && m.totalCount > 0).length;

  // Build search params for sort links (preserve search)
  const sortLinkParams: Record<string, string> = {};
  if (search) sortLinkParams.q = search;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">視聴進捗</h1>

      {videos.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500">
          割り当てられた動画がありません
        </div>
      ) : (
        <>
          {/* Stats */}
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

          {/* Search + Sort */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <SearchInput placeholder="名前・メールで検索..." paramName="q" className="max-w-sm" />
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-slate-500 mr-1">並び替え:</span>
              <SortLink label="名前" sortKey="display_name" currentSort={sort} currentOrder={order} searchParams={sortLinkParams} />
              <SortLink label="進捗率" sortKey="watchedPercent" currentSort={sort} currentOrder={order} searchParams={sortLinkParams} />
              <SortLink label="完了数" sortKey="completedCount" currentSort={sort} currentOrder={order} searchParams={sortLinkParams} />
            </div>
          </div>

          {/* Member list */}
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
                    className={`block px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      isFullyCompleted ? "bg-emerald-50 dark:bg-emerald-900/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      {member.avatar_url ? (
                        <AvatarPreview src={member.avatar_url} size={40} className="w-10 h-10" />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${
                          isFullyCompleted
                            ? "bg-da-blue-900 text-white"
                            : "bg-slate-500 dark:bg-slate-600"
                        }`}>
                          {member.display_name?.charAt(0) || "?"}
                        </div>
                      )}

                      {/* Name / Email */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 dark:text-white font-medium truncate">
                            {member.display_name}
                          </span>
                          {isFullyCompleted && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 shadow-sm crown-badge">
                              <CrownIcon className="w-3 h-3" strokeWidth={2.5} />
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 text-sm truncate">{member.email}</div>
                      </div>

                      {/* Progress - desktop */}
                      <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
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
                        <div className="w-24">
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

                      {/* Progress - mobile (compact) */}
                      <div className="flex sm:hidden items-center gap-2 flex-shrink-0">
                        <span className={`text-sm font-bold ${
                          isFullyCompleted
                            ? "text-da-success dark:text-emerald-400"
                            : member.watchedPercent > 0
                              ? "text-da-blue-900 dark:text-da-blue-300"
                              : "text-slate-400"
                        }`}>
                          {member.watchedPercent}%
                        </span>
                        <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>

                    {/* Progress bar - mobile */}
                    <div className="sm:hidden mt-2 ml-[52px]">
                      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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
                      <div className="text-xs text-slate-500 mt-0.5">
                        {member.completedCount}/{member.totalCount} 完了
                      </div>
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
