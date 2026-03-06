import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole, getCurrentOrg } from "@/lib/auth";
import {
  listLicensedVideosForOrg,
  listOrgCategoryOrder,
  listCategories,
  getViewLogsByUsers,
  getProfileById,
  getMembershipByUserId,
} from "@/lib/db";
import { ArrowLeftIcon, CheckCircleIcon } from "@/components/icons";
import CategoryAccordion from "./category-accordion";

type VideoProgress = {
  id: number;
  title: string;
  duration: number;
  category_name: string;
  max_watched_seconds: number;
  completed: boolean;
  percent: number;
};

export default async function MemberProgressPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireRole("org_admin");
  const org = await getCurrentOrg();
  if (!org) return null;

  const { userId } = await params;
  const supabase = await createClient();

  // メンバーがこの組織に所属しているか確認
  const { data: membership } = await getMembershipByUserId(supabase, userId);
  if (!membership || membership.organization_id !== org.id) {
    notFound();
  }

  // プロフィール取得
  const { data: profile } = await getProfileById(supabase, userId);
  if (!profile) {
    notFound();
  }

  // ライセンスされた動画 + 組織カテゴリ順を取得
  const [{ data: licenses }, { data: orgCatOrders }, { data: allCategories }, { data: viewLogs }] =
    await Promise.all([
      listLicensedVideosForOrg(supabase, org.id),
      listOrgCategoryOrder(supabase, org.id),
      listCategories(supabase),
      getViewLogsByUsers(supabase, [userId]),
    ]);

  // 組織別カテゴリ順マップ
  const orgCatOrderMap = new Map(
    (orgCatOrders || []).map((o: { category_id: number; display_order: number }) => [o.category_id, o.display_order])
  );

  // カテゴリ名→IDマップ
  const catNameToId = new Map(
    (allCategories || []).map((c: { id: number; name: string; display_order: number }) => [c.name, { id: c.id, display_order: c.display_order }])
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const videos = (licenses || [])
    .map((l: any) => {
      const v = l.videos;
      if (!v) return null;
      return {
        id: v.id as number,
        title: v.title as string,
        duration: v.duration as number,
        display_order: v.display_order as number,
        orgDisplayOrder: l.display_order as number | null,
        categories: v.categories as { name: string; display_order: number } | null,
      };
    })
    .filter(Boolean) as {
      id: number;
      title: string;
      duration: number;
      display_order: number;
      orgDisplayOrder: number | null;
      categories: { name: string; display_order: number } | null;
    }[];

  // 動画を組織順でソート（フォールバック: グローバル順）
  videos.sort((a, b) => {
    const aOrder = a.orgDisplayOrder ?? a.display_order;
    const bOrder = b.orgDisplayOrder ?? b.display_order;
    return aOrder - bOrder;
  });

  // 動画ごとの進捗を計算
  const videoProgress: VideoProgress[] = videos.map((v) => {
    const log = viewLogs?.find((l) => l.video_id === v.id);
    const maxWatched = log?.max_watched_seconds || 0;
    const percent = v.duration > 0 ? Math.round((maxWatched / v.duration) * 100) : 0;

    return {
      id: v.id,
      title: v.title,
      duration: v.duration,
      category_name: v.categories!.name,
      max_watched_seconds: maxWatched,
      completed: log?.completed || false,
      percent: Math.min(percent, 100),
    };
  });

  // カテゴリでグループ化（組織順でソート）
  const categoryNames = [...new Set(videoProgress.map((v) => v.category_name))];
  categoryNames.sort((a, b) => {
    const catA = catNameToId.get(a);
    const catB = catNameToId.get(b);
    const aOrder = (catA ? orgCatOrderMap.get(catA.id) : undefined) ?? catA?.display_order ?? 0;
    const bOrder = (catB ? orgCatOrderMap.get(catB.id) : undefined) ?? catB?.display_order ?? 0;
    return aOrder - bOrder;
  });
  const videosByCategory = categoryNames.map((cat) => ({
    name: cat,
    videos: videoProgress.filter((v) => v.category_name === cat),
  }));

  // サマリー
  const completedCount = videoProgress.filter((v) => v.completed).length;
  const totalCount = videoProgress.length;
  const totalDuration = videoProgress.reduce((acc, v) => acc + v.duration, 0);
  const totalWatched = videoProgress.reduce((acc, v) => acc + Math.min(v.max_watched_seconds, v.duration), 0);
  const overallPercent = totalDuration > 0 ? Math.round((totalWatched / totalDuration) * 100) : 0;
  const inProgressCount = videoProgress.filter((v) => !v.completed && v.max_watched_seconds > 0).length;

  return (
    <div>
      {/* ヘッダー */}
      <div className="mb-6">
        <Link
          href="/org/progress"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm transition-colors"
        >
          <ArrowLeftIcon />
          メンバー一覧に戻る
        </Link>
      </div>

      {/* プロフィール */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${
            completedCount === totalCount && totalCount > 0
              ? "bg-da-blue-900 text-white"
              : "bg-slate-500 dark:bg-slate-600"
          }`}>
            {profile.display_name?.charAt(0) || "?"}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {profile.display_name}
              {completedCount === totalCount && totalCount > 0 && (
                <CheckCircleIcon className="w-6 h-6 text-da-success" />
              )}
            </h1>
            <p className="text-slate-500">{profile.email}</p>
          </div>
        </div>

        {/* 進捗サマリー */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="text-center">
            <div className="text-3xl font-bold text-da-success dark:text-emerald-400">{completedCount}</div>
            <div className="text-sm text-slate-500">完了</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{inProgressCount}</div>
            <div className="text-sm text-slate-500">視聴中</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-da-blue-900 dark:text-da-blue-300">{overallPercent}%</div>
            <div className="text-sm text-slate-500">視聴率</div>
          </div>
        </div>

        {/* 全体プログレスバー */}
        <div className="mt-4">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                completedCount === totalCount && totalCount > 0
                  ? "bg-da-success"
                  : "bg-da-blue-900"
              }`}
              style={{ width: `${overallPercent}%` }}
            />
          </div>
          <div className="text-right text-xs text-slate-500 mt-1">
            {completedCount}/{totalCount} 動画完了
          </div>
        </div>
      </div>

      {/* 動画一覧（カテゴリ別アコーディオン） */}
      <div className="space-y-4">
        {videosByCategory.map((category) => (
          <CategoryAccordion
            key={category.name}
            name={category.name}
            videos={category.videos}
          />
        ))}
      </div>

      {videoProgress.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500">
          ライセンスのある動画がありません
        </div>
      )}
    </div>
  );
}
