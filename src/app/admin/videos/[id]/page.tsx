import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  Badge,
  PageHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui";
import {
  ArrowLeftIcon,
  VideoIcon,
  FolderIcon,
  ClockIcon,
  BuildingIcon,
  UsersIcon,
  CheckCircleIcon,
  PlayIcon,
} from "@/components/icons";

// ── ヘルパー ──

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── ページ ──

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const videoId = parseInt(id, 10);
  if (isNaN(videoId)) notFound();

  const supabase = await createClient();

  // 動画情報
  const { data: video } = await supabase
    .from("videos")
    .select("*, categories(name)")
    .eq("id", videoId)
    .single();

  if (!video) notFound();

  // 割当先の組織一覧
  const { data: assignments } = await supabase
    .from("organization_licenses")
    .select("organization_id, expires_at, is_active, label, label_color, organizations(id, name)")
    .eq("video_id", videoId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // 視聴ログ（この動画の全ユーザー）
  const { data: viewLogs } = await supabase
    .from("view_logs")
    .select("user_id, max_watched_seconds, completed, completed_at, profiles(display_name, email)")
    .eq("video_id", videoId)
    .order("completed_at", { ascending: false, nullsFirst: false });

  const logs = viewLogs || [];
  const assignmentList = assignments || [];

  // ── 統計 ──
  const completedCount = logs.filter((l) => l.completed).length;
  const viewerCount = logs.length;
  const orgCount = assignmentList.length;

  // 平均視聴時間
  const avgWatched =
    viewerCount > 0
      ? Math.round(logs.reduce((sum, l) => sum + l.max_watched_seconds, 0) / viewerCount)
      : 0;

  // 完了率
  const completionRate = viewerCount > 0 ? Math.round((completedCount / viewerCount) * 100) : 0;

  // 期限切れ間近（30日以内）
  const now = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  const expiringAssignments = assignmentList.filter(
    (a) => a.expires_at && new Date(a.expires_at) >= now && new Date(a.expires_at) <= thirtyDays
  );

  const category = video.categories as { name: string } | null;

  return (
    <div>
      {/* ヘッダー */}
      <div className="mb-6">
        <Link
          href="/admin/videos"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          動画一覧に戻る
        </Link>
      </div>

      <PageHeader
        title={video.title}
        description={video.description || undefined}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={video.is_published ? "success" : "danger"}>
              {video.is_published ? "公開" : "非公開"}
            </Badge>
          </div>
        }
      />

      {/* サマリーカード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                <UsersIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">視聴したユーザー</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{viewerCount}人</p>
                <p className="text-xs text-slate-500">{completedCount}人が完了</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                <CheckCircleIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">視聴完了率</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                <PlayIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">平均視聴時間</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{formatDuration(avgWatched)}</p>
                <p className="text-xs text-slate-500">/ {formatDuration(video.duration)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                <BuildingIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">割当先の組織数</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{orgCount}</p>
                {expiringAssignments.length > 0 && (
                  <p className="text-xs text-amber-600">{expiringAssignments.length}件が期限切れ間近</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 動画情報 */}
      <Card className="mb-6">
        <CardContent>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">動画情報</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-500">カテゴリ</span>
              <div className="flex items-center gap-1.5 mt-1 text-slate-900 dark:text-white">
                <FolderIcon className="w-4 h-4 text-slate-400" />
                {category?.name || "未設定"}
              </div>
            </div>
            <div>
              <span className="text-slate-500">再生時間</span>
              <div className="flex items-center gap-1.5 mt-1 text-slate-900 dark:text-white">
                <ClockIcon className="w-4 h-4 text-slate-400" />
                {formatDuration(video.duration)}
              </div>
            </div>
            <div>
              <span className="text-slate-500">動画ID</span>
              <div className="flex items-center gap-1.5 mt-1 text-slate-900 dark:text-white">
                <VideoIcon className="w-4 h-4 text-slate-400" />
                {video.cf_video_id ? video.cf_video_id.slice(0, 12) + "..." : "未設定"}
              </div>
            </div>
            <div>
              <span className="text-slate-500">作成日</span>
              <div className="mt-1 text-slate-900 dark:text-white">
                {formatDate(video.created_at)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 割当先組織 */}
      <Card className="mb-6">
        <CardContent>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">割当先の組織 ({orgCount})</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>組織名</TableHead>
                <TableHead className="hidden sm:table-cell">ラベル</TableHead>
                <TableHead className="hidden md:table-cell">有効期限</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignmentList.map((a) => {
                const org = a.organizations as unknown as { id: string; name: string } | null;
                const isExpiringSoon =
                  a.expires_at && new Date(a.expires_at) >= now && new Date(a.expires_at) <= thirtyDays;
                const isExpired = a.expires_at && new Date(a.expires_at) < now;

                return (
                  <TableRow key={a.organization_id}>
                    <TableCell>
                      <Link
                        href={`/admin/organizations/${org?.id}`}
                        className="text-slate-900 dark:text-white font-medium hover:text-da-blue-900 dark:hover:text-da-blue-300 transition-colors"
                      >
                        {org?.name || "不明"}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {a.label ? (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: a.label_color ? `${a.label_color}20` : undefined,
                            color: a.label_color || undefined,
                          }}
                        >
                          {a.label}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {a.expires_at ? (
                        <span
                          className={
                            isExpired
                              ? "text-red-600 dark:text-red-400"
                              : isExpiringSoon
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-slate-600 dark:text-slate-400"
                          }
                        >
                          {formatDate(a.expires_at)}
                          {isExpired && " (期限切れ)"}
                          {isExpiringSoon && " (間近)"}
                        </span>
                      ) : (
                        <span className="text-slate-400">無期限</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {assignmentList.length === 0 && (
                <TableEmpty colSpan={3} message="この動画はどの組織にも割り当てられていません" />
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 視聴ログ */}
      <Card>
        <CardContent>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">視聴状況 ({viewerCount}人)</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ユーザー</TableHead>
                <TableHead>視聴時間</TableHead>
                <TableHead className="hidden sm:table-cell">進捗</TableHead>
                <TableHead>ステータス</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const profile = log.profiles as unknown as { display_name: string | null; email: string } | null;
                const progress =
                  video.duration > 0
                    ? Math.min(100, Math.round((log.max_watched_seconds / video.duration) * 100))
                    : 0;

                return (
                  <TableRow key={log.user_id}>
                    <TableCell>
                      <div>
                        <div className="text-slate-900 dark:text-white text-sm font-medium">
                          {profile?.display_name || "名前なし"}
                        </div>
                        <div className="text-xs text-slate-500">{profile?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                      {formatDuration(log.max_watched_seconds)} / {formatDuration(video.duration)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${log.completed ? "bg-emerald-500" : "bg-da-blue-900"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.completed ? "success" : "warning"}>
                        {log.completed ? "完了" : "視聴中"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {logs.length === 0 && (
                <TableEmpty colSpan={4} message="まだ誰もこの動画を視聴していません" />
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
