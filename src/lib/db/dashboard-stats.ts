import type { TypedClient } from "./types";

/** 全組織の進捗（メンバー数・完了数・ライセンス数） */
export async function getOrgProgressSummaries(client: TypedClient) {
  // 全組織取得
  const { data: orgs } = await client
    .from("organizations")
    .select("id, name, is_active")
    .eq("is_active", true)
    .order("name");

  if (!orgs || orgs.length === 0) return [];

  const results = await Promise.all(
    orgs.map(async (org) => {
      // メンバー数
      const { count: memberCount } = await client
        .from("organization_members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.id)
        .eq("role", "member");

      // ライセンス数
      const { data: licenses } = await client
        .from("organization_licenses")
        .select("video_id, videos(duration)")
        .eq("organization_id", org.id)
        .eq("is_active", true);

      // メンバーIDリスト
      const { data: members } = await client
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", org.id)
        .eq("role", "member");

      const memberIds = (members || []).map((m) => m.user_id);
      const videoIds = (licenses || []).map((l) => l.video_id);

      let completedMembers = 0;
      if (memberIds.length > 0 && videoIds.length > 0) {
        // 各メンバーの完了動画数をカウント
        const { data: viewLogs } = await client
          .from("view_logs")
          .select("user_id, video_id, completed")
          .in("user_id", memberIds)
          .in("video_id", videoIds)
          .eq("completed", true);

        // 全動画完了したメンバーをカウント
        const completionMap = new Map<string, number>();
        for (const log of viewLogs || []) {
          completionMap.set(log.user_id, (completionMap.get(log.user_id) || 0) + 1);
        }
        for (const [, count] of completionMap) {
          if (count >= videoIds.length) completedMembers++;
        }
      }

      return {
        id: org.id,
        name: org.name,
        memberCount: memberCount ?? 0,
        videoCount: videoIds.length,
        completedMembers,
      };
    })
  );

  return results;
}

/** 期限が近い/切れたライセンス */
export async function getExpiringLicenses(client: TypedClient, withinDays: number = 30) {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + withinDays);

  const { data } = await client
    .from("organization_licenses")
    .select("organization_id, expires_at, organizations(name), videos(title)")
    .eq("is_active", true)
    .not("expires_at", "is", null)
    .lte("expires_at", future.toISOString())
    .order("expires_at");

  return (data || []).map((lic) => ({
    orgId: lic.organization_id,
    orgName: (lic.organizations as unknown as { name: string })?.name ?? "不明",
    videoTitle: (lic.videos as unknown as { title: string })?.title ?? "不明",
    expiresAt: lic.expires_at!,
    isExpired: new Date(lic.expires_at!) < now,
  }));
}

/** 動画別の視聴完了数マップ */
export async function getVideoCompletionCounts(client: TypedClient) {
  const { data: logs } = await client
    .from("view_logs")
    .select("video_id, completed")
    .eq("completed", true);

  const countMap = new Map<number, number>();
  for (const log of logs || []) {
    countMap.set(log.video_id, (countMap.get(log.video_id) || 0) + 1);
  }
  return countMap;
}

/** 動画別の視聴完了数ランキング */
export async function getVideoCompletionRanking(client: TypedClient, limit: number = 5) {
  const { data: videos } = await client
    .from("videos")
    .select("id, title")
    .eq("is_published", true);

  if (!videos || videos.length === 0) return [];

  const countMap = await getVideoCompletionCounts(client);

  return videos
    .map((v) => ({
      id: v.id,
      title: v.title,
      completions: countMap.get(v.id) || 0,
    }))
    .sort((a, b) => b.completions - a.completions)
    .slice(0, limit);
}

/** 直近7日間の日別視聴アクティビティ */
export async function getDailyViewActivity(client: TypedClient, days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await client
    .from("view_logs")
    .select("updated_at")
    .gte("updated_at", since.toISOString());

  // 日別に集計
  const countByDate = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    countByDate.set(d.toISOString().split("T")[0], 0);
  }

  for (const log of data || []) {
    const dateKey = log.updated_at.split("T")[0];
    if (countByDate.has(dateKey)) {
      countByDate.set(dateKey, countByDate.get(dateKey)! + 1);
    }
  }

  return Array.from(countByDate.entries()).map(([date, count]) => ({
    date,
    label: new Date(date + "T00:00:00").toLocaleDateString("ja-JP", { month: "short", day: "numeric" }),
    count,
  }));
}

/** ギャラリーストレージ使用量 */
export async function getGalleryStats(client: TypedClient) {
  const { data } = await client
    .from("gallery_images")
    .select("file_size");

  const images = data || [];
  const totalBytes = images.reduce((sum, img) => sum + (img.file_size || 0), 0);

  const { count: folderCount } = await client
    .from("gallery_folders")
    .select("id", { count: "exact", head: true });

  return {
    imageCount: images.length,
    folderCount: folderCount ?? 0,
    totalBytes,
  };
}

/** 全メンバー数（member ロールのみ） */
export async function countAllMembers(client: TypedClient) {
  const { count } = await client
    .from("organization_members")
    .select("id", { count: "exact", head: true })
    .eq("role", "member");
  return count ?? 0;
}

/** 今月の新規メンバー数・新規組織数 */
export async function getThisMonthGrowth(client: TypedClient) {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ count: newMembers }, { count: newOrgs }] = await Promise.all([
    client
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .gte("joined_at", firstOfMonth),
    client
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", firstOfMonth),
  ]);

  return { newMembers: newMembers ?? 0, newOrgs: newOrgs ?? 0 };
}

/** 招待状況（保留中・承認済み） */
export async function getInvitationStats(client: TypedClient) {
  const now = new Date().toISOString();

  const [{ count: pending }, { count: accepted }] = await Promise.all([
    client
      .from("invitations")
      .select("id", { count: "exact", head: true })
      .is("accepted_at", null)
      .gt("expires_at", now),
    client
      .from("invitations")
      .select("id", { count: "exact", head: true })
      .not("accepted_at", "is", null),
  ]);

  return { pending: pending ?? 0, accepted: accepted ?? 0 };
}

/** 全体の視聴完了率 + 直近7日のアクティブユニークユーザー数 */
export async function getOverallCompletionAndActivity(client: TypedClient) {
  const { data: allLogs } = await client
    .from("view_logs")
    .select("user_id, completed, updated_at");

  const logs = allLogs || [];
  const totalLogs = logs.length;
  const completedLogs = logs.filter((l) => l.completed).length;
  const completionRate = totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString();

  const activeUsers = new Set<string>();
  for (const log of logs) {
    if (log.updated_at >= sevenDaysAgoStr) {
      activeUsers.add(log.user_id);
    }
  }

  return { completionRate, completedLogs, totalLogs, activeUsersLast7Days: activeUsers.size };
}

/** 日別の累計数推移（7日間）— スパークライン用 */
export async function getSparklineData(
  client: TypedClient,
  table: "organizations" | "organization_members",
  dateColumn: "created_at" | "joined_at",
  days: number = 7
) {
  const { data } = await client
    .from(table)
    .select(dateColumn)
    .order(dateColumn);

  const rows = data || [];
  const result: number[] = [];

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    d.setHours(23, 59, 59, 999);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const count = rows.filter((r: any) => new Date(r[dateColumn]) <= d).length;
    result.push(count);
  }

  return result;
}
