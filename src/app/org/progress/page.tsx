import { createClient } from "@/lib/supabase/server";
import { requireRole, getCurrentOrg } from "@/lib/auth";
import {
  listOrgMemberProfiles,
  listLicensedVideosForOrg,
  getViewLogsByUsers,
} from "@/lib/db";

type MemberProgress = {
  user_id: string;
  display_name: string;
  email: string;
  videos: {
    video_id: number;
    title: string;
    duration: number;
    max_watched_seconds: number;
    completed: boolean;
  }[];
};

export default async function ProgressPage() {
  await requireRole("org_admin");
  const org = await getCurrentOrg();
  if (!org) return null;

  const supabase = await createClient();

  const { data: members } = await listOrgMemberProfiles(supabase, org.id);
  const { data: licenses } = await listLicensedVideosForOrg(supabase, org.id);

  const videos =
    licenses
      ?.map((l) => l.videos as unknown as { id: number; title: string; duration: number; display_order: number })
      .filter(Boolean)
      .sort((a, b) => a.display_order - b.display_order) || [];

  const memberIds = members?.map((m) => m.user_id) || [];

  const { data: viewLogs } = await getViewLogsByUsers(supabase, memberIds);

  const progressData: MemberProgress[] =
    members?.map((m) => {
      const profile = m.profiles as unknown as {
        display_name: string;
        email: string;
      };
      return {
        user_id: m.user_id,
        display_name: profile?.display_name || "",
        email: profile?.email || "",
        videos: videos.map((v) => {
          const log = viewLogs?.find(
            (l) => l.user_id === m.user_id && l.video_id === v.id
          );
          return {
            video_id: v.id,
            title: v.title,
            duration: v.duration,
            max_watched_seconds: log?.max_watched_seconds || 0,
            completed: log?.completed || false,
          };
        }),
      };
    }) || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">視聴進捗</h1>

      {videos.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500">
          ライセンスのある動画がありません
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 sticky left-0 bg-slate-50 dark:bg-slate-800 min-w-[180px]">
                  メンバー
                </th>
                {videos.map((v) => (
                  <th
                    key={v.id}
                    className="text-center px-3 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 min-w-[100px]"
                  >
                    <div className="truncate max-w-[100px]" title={v.title}>
                      {v.title}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {progressData.map((member) => (
                <tr
                  key={member.user_id}
                  className="border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                >
                  <td className="px-4 py-3 sticky left-0 bg-white dark:bg-slate-800">
                    <div className="text-slate-900 dark:text-white text-sm">
                      {member.display_name}
                    </div>
                    <div className="text-slate-500 text-xs">{member.email}</div>
                  </td>
                  {member.videos.map((v) => {
                    const percent =
                      v.duration > 0
                        ? Math.round(
                            (v.max_watched_seconds / v.duration) * 100
                          )
                        : 0;
                    return (
                      <td key={v.video_id} className="px-3 py-3 text-center">
                        {v.completed ? (
                          <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                            完了
                          </span>
                        ) : v.max_watched_seconds > 0 ? (
                          <span className="text-yellow-600 dark:text-yellow-400 text-sm">
                            {percent}%
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 text-sm">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {progressData.length === 0 && (
                <tr>
                  <td
                    colSpan={videos.length + 1}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    メンバーがいません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
