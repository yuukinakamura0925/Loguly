"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  getOrganizationById,
  listOrgMembers,
  listAllProfilesWithOrg,
  listLicenseVideoIdsForOrg,
  listVideosWithCategory,
  listCategories,
} from "@/lib/db";
import {
  updateOrganization,
  addOrgMember,
  removeOrgMember,
  createOrgUser,
  changeOrgMemberRole,
} from "../actions";
import { updateOrgLicenses } from "../../licenses/actions";
import {
  Button,
  Input,
  Select,
  Switch,
  Card,
  CardContent,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  ConfirmModal,
} from "@/components/ui";
import {
  ArrowLeftIcon,
  TrashIcon,
  PlusIcon,
  UsersIcon,
  VideoIcon,
  FolderIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  KeyIcon,
  SettingsIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@/components/icons";

// ── 型定義 ──

type Member = {
  id: string;
  user_id: string;
  role: string;
  profiles: { email: string; display_name: string };
};

type Profile = {
  id: string;
  email: string;
  display_name: string;
  role: string;
  organization_members: { organization_id: string; role: string; organizations: { name: string } | null }[];
};

type Category = { id: number; name: string; display_order: number };
type Video = { id: number; title: string; category_id: number; display_order: number };
type ViewLog = { user_id: string; video_id: number; completed: boolean };
type Tab = "overview" | "licenses" | "members" | "settings";

// ── タブ定義 ──

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "概要", icon: CheckCircleIcon },
  { key: "licenses", label: "動画割り当て", icon: KeyIcon },
  { key: "members", label: "メンバー", icon: UsersIcon },
  { key: "settings", label: "設定", icon: SettingsIcon },
];

export default function OrgDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = useMemo(() => createClient(), []);

  // ── 共有ステート ──
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // 組織情報
  const [orgName, setOrgName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [maxOrgAdmins, setMaxOrgAdmins] = useState(1);

  // メンバー
  const [members, setMembers] = useState<Member[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [viewLogs, setViewLogs] = useState<ViewLog[]>([]);

  // ライセンス
  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<number>>(new Set());
  const [originalVideoIds, setOriginalVideoIds] = useState<Set<number>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [expiresAt, setExpiresAt] = useState("");
  const [videoExpiresMap, setVideoExpiresMap] = useState<Map<number, string>>(new Map());

  // UI状態
  const [error, setError] = useState("");
  const [memberError, setMemberError] = useState("");
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [licenseError, setLicenseError] = useState("");
  const [licenseSuccess, setLicenseSuccess] = useState("");
  const [updating, setUpdating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removeTargetId, setRemoveTargetId] = useState<string | null>(null);

  // ── データ取得 ──

  useEffect(() => {
    let active = true;
    async function fetchData() {
      const [
        { data: org },
        { data: mems },
        { data: profiles },
        { data: licenseData },
        { data: cats },
        { data: vids },
      ] = await Promise.all([
        getOrganizationById(supabase, id),
        listOrgMembers(supabase, id),
        listAllProfilesWithOrg(supabase),
        listLicenseVideoIdsForOrg(supabase, id),
        listCategories(supabase),
        listVideosWithCategory(supabase),
      ]);

      if (!active) return;

      if (org) {
        setOrgName(org.name);
        setIsActive(org.is_active);
        setMaxOrgAdmins(org.max_org_admins ?? 1);
      }
      setMembers((mems as unknown as Member[]) || []);
      setAllProfiles((profiles as unknown as Profile[]) || []);
      setCategories((cats as Category[]) || []);
      setVideos((vids as Video[]) || []);

      // ライセンス
      const licenses = licenseData || [];
      const licIds = new Set(licenses.map((l) => l.video_id));
      setSelectedVideoIds(licIds);
      setOriginalVideoIds(new Set(licIds));
      setExpandedCategories(new Set((cats as Category[] || []).map((c) => c.id)));

      const expMap = new Map<number, string>();
      licenses.forEach((l) => {
        if (l.expires_at) expMap.set(l.video_id, l.expires_at.split("T")[0]);
      });
      setVideoExpiresMap(expMap);
      const dates = [...new Set([...expMap.values()])];
      setExpiresAt(dates.length === 1 ? dates[0] : "");

      // 進捗用の視聴ログ
      const memberIds = ((mems as unknown as Member[]) || [])
        .filter((m) => m.role === "member")
        .map((m) => m.user_id);
      const videoIds = licenses.map((l) => l.video_id);

      if (memberIds.length > 0 && videoIds.length > 0) {
        const { data: logs } = await supabase
          .from("view_logs")
          .select("user_id, video_id, completed")
          .in("user_id", memberIds)
          .in("video_id", videoIds);
        if (active) setViewLogs(logs || []);
      } else {
        setViewLogs([]);
      }

      setLoading(false);
    }
    fetchData();
    return () => { active = false; };
  }, [id, supabase, refreshKey]);

  function reload() { setRefreshKey((k) => k + 1); }

  // ── 算出値 ──

  const memberOnly = members.filter((m) => m.role === "member");
  const orgAdmins = members.filter((m) => m.role === "org_admin");
  const licensedVideoIds = [...selectedVideoIds];

  const { freeUsers, otherOrgUsers } = useMemo(() => {
    const memberIds = new Set(members.map((m) => m.user_id));
    const nonMembers = allProfiles.filter((p) => !memberIds.has(p.id));
    const free: Profile[] = [];
    const other: (Profile & { orgName: string })[] = [];
    for (const p of nonMembers) {
      const membership = p.organization_members?.[0];
      const orgName = membership?.organizations?.name;
      if (orgName) {
        // 他組織の管理者は移動対象から除外
        if (membership.role === "org_admin") continue;
        other.push({ ...p, orgName });
      } else {
        free.push(p);
      }
    }
    return { freeUsers: free, otherOrgUsers: other };
  }, [allProfiles, members]);

  // メンバー進捗: user_id -> { completed, total }
  const memberProgress = useMemo(() => {
    const totalVideos = originalVideoIds.size;
    const map = new Map<string, { completed: number; total: number }>();
    for (const m of memberOnly) {
      const completed = viewLogs.filter(
        (l) => l.user_id === m.user_id && l.completed && originalVideoIds.has(l.video_id)
      ).length;
      map.set(m.user_id, { completed, total: totalVideos });
    }
    return map;
  }, [memberOnly, viewLogs, originalVideoIds]);

  // サマリー統計
  const completedMembers = [...memberProgress.values()].filter(
    (p) => p.total > 0 && p.completed >= p.total
  ).length;

  const nearestExpiry = useMemo(() => {
    const dates = [...videoExpiresMap.values()].sort();
    return dates.length > 0 ? dates[0] : null;
  }, [videoExpiresMap]);

  const isExpiringSoon = nearestExpiry
    ? new Date(nearestExpiry) <= new Date(Date.now() + 30 * 86400000)
    : false;

  // ── ハンドラー: 設定 ──

  async function handleUpdateOrg(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUpdating(true);
    setError("");
    try {
      const formData = new FormData(e.currentTarget);
      const result = await updateOrganization(id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/admin/organizations");
      }
    } finally {
      setUpdating(false);
    }
  }

  // ── ハンドラー: メンバー ──

  async function handleAddMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAdding(true);
    setMemberError("");
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("organization_id", id);
      const result = await addOrgMember(formData);
      if (result.error) setMemberError(result.error);
      else reload();
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveMember() {
    if (!removeTargetId) return;
    setMemberError("");
    const result = await removeOrgMember(id, removeTargetId);
    if (result.error) setMemberError(result.error);
    else reload();
    setRemoveTargetId(null);
  }

  async function handleChangeRole(userId: string, newRole: string) {
    setMemberError("");
    const result = await changeOrgMemberRole(id, userId, newRole);
    if (result.error) setMemberError(result.error);
    else reload();
  }

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    setCreateSuccess("");
    try {
      const formData = new FormData(e.currentTarget);
      const result = await createOrgUser(id, formData);
      if (result.error) setCreateError(result.error);
      else { setCreateSuccess("ユーザーを作成しました"); reload(); }
    } finally {
      setCreating(false);
    }
  }

  // ── ハンドラー: ライセンス ──

  function getVideosInCategory(categoryId: number) {
    return videos.filter((v) => v.category_id === categoryId);
  }

  function isCategoryFullySelected(categoryId: number) {
    const cv = getVideosInCategory(categoryId);
    return cv.length > 0 && cv.every((v) => selectedVideoIds.has(v.id));
  }

  function isCategoryPartiallySelected(categoryId: number) {
    const cv = getVideosInCategory(categoryId);
    const n = cv.filter((v) => selectedVideoIds.has(v.id)).length;
    return n > 0 && n < cv.length;
  }

  function toggleCategoryVideos(categoryId: number) {
    const cv = getVideosInCategory(categoryId);
    const allSelected = isCategoryFullySelected(categoryId);
    setSelectedVideoIds((prev) => {
      const next = new Set(prev);
      cv.forEach((v) => { allSelected ? next.delete(v.id) : next.add(v.id); });
      return next;
    });
  }

  function toggleVideo(videoId: number) {
    setSelectedVideoIds((prev) => {
      const next = new Set(prev);
      next.has(videoId) ? next.delete(videoId) : next.add(videoId);
      return next;
    });
  }

  function toggleCategory(categoryId: number) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  }

  function handleBulkExpiresChange(date: string) {
    setExpiresAt(date);
    setVideoExpiresMap((prev) => {
      const next = new Map(prev);
      selectedVideoIds.forEach((vid) => { date ? next.set(vid, date) : next.delete(vid); });
      return next;
    });
  }

  function handleVideoExpiresChange(videoId: number, date: string) {
    setVideoExpiresMap((prev) => {
      const next = new Map(prev);
      date ? next.set(videoId, date) : next.delete(videoId);
      return next;
    });
  }

  async function handleSaveLicenses() {
    setSaving(true);
    setLicenseError("");
    setLicenseSuccess("");
    try {
      const expiresRecord: Record<string, string | null> = {};
      selectedVideoIds.forEach((vid) => {
        expiresRecord[String(vid)] = videoExpiresMap.get(vid) || null;
      });
      const result = await updateOrgLicenses(
        id,
        Array.from(selectedVideoIds),
        videos.map((v) => v.id),
        expiresRecord
      );
      if (result.error) {
        setLicenseError(result.error);
      } else {
        setLicenseSuccess("割り当てを更新しました");
        setOriginalVideoIds(new Set(selectedVideoIds));
        reload();
      }
    } catch (e) {
      setLicenseError(e instanceof Error ? e.message : "保存中にエラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  const hasLicenseChanges =
    selectedVideoIds.size !== originalVideoIds.size ||
    Array.from(selectedVideoIds).some((vid) => !originalVideoIds.has(vid));

  // ── ローディング ──

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">読み込み中...</div>
      </div>
    );
  }

  // ── 描画 ──

  return (
    <div>
      {/* ヘッダー */}
      <div className="mb-6">
        <Link
          href="/admin/organizations"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          組織一覧に戻る
        </Link>
        <div className="flex items-center gap-3 mt-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{orgName}</h1>
          <Badge variant={isActive ? "success" : "danger"}>
            {isActive ? "有効" : "無効"}
          </Badge>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          label="メンバー"
          value={members.length}
          sub={`管理者 ${orgAdmins.length} / メンバー ${memberOnly.length}`}
          icon={<UsersIcon className="w-5 h-5" />}
        />
        <SummaryCard
          label="割当動画"
          value={originalVideoIds.size}
          sub={`全 ${videos.length} 動画中`}
          icon={<VideoIcon className="w-5 h-5" />}
        />
        <SummaryCard
          label="全完了メンバー"
          value={`${completedMembers} / ${memberOnly.length}`}
          sub={memberOnly.length > 0 ? `${Math.round((completedMembers / memberOnly.length) * 100)}%` : "—"}
          icon={<CheckCircleIcon className="w-5 h-5" />}
        />
        <SummaryCard
          label="最短有効期限"
          value={nearestExpiry || "期限なし"}
          sub={isExpiringSoon ? "30日以内に期限切れ" : nearestExpiry ? "期限に余裕あり" : ""}
          icon={<ClockIcon className="w-5 h-5" />}
          variant={isExpiringSoon ? "warning" : "default"}
        />
      </div>

      {/* タブ */}
      <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
                  ${isActive
                    ? "border-da-blue-900 text-da-blue-900 dark:border-da-blue-300 dark:text-da-blue-300"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* タブコンテンツ */}
      {activeTab === "overview" && (
        <OverviewTab
          members={memberOnly}
          memberProgress={memberProgress}
          originalVideoIds={originalVideoIds}
          videos={videos}
        />
      )}

      {activeTab === "licenses" && (
        <LicensesTab
          categories={categories}
          videos={videos}
          selectedVideoIds={selectedVideoIds}
          expandedCategories={expandedCategories}
          videoExpiresMap={videoExpiresMap}
          expiresAt={expiresAt}
          saving={saving}
          error={licenseError}
          success={licenseSuccess}
          hasChanges={hasLicenseChanges}
          getVideosInCategory={getVideosInCategory}
          isCategoryFullySelected={isCategoryFullySelected}
          isCategoryPartiallySelected={isCategoryPartiallySelected}
          toggleCategoryVideos={toggleCategoryVideos}
          toggleVideo={toggleVideo}
          toggleCategory={toggleCategory}
          handleBulkExpiresChange={handleBulkExpiresChange}
          handleVideoExpiresChange={handleVideoExpiresChange}
          handleSave={handleSaveLicenses}
        />
      )}

      {activeTab === "members" && (
        <MembersTab
          members={members}
          freeUsers={freeUsers}
          otherOrgUsers={otherOrgUsers}
          memberError={memberError}
          createError={createError}
          createSuccess={createSuccess}
          creating={creating}
          adding={adding}
          removeTargetId={removeTargetId}
          handleCreateUser={handleCreateUser}
          handleAddMember={handleAddMember}
          handleRemoveMember={handleRemoveMember}
          handleChangeRole={handleChangeRole}
          setRemoveTargetId={setRemoveTargetId}
        />
      )}

      {activeTab === "settings" && (
        <SettingsTab
          name={orgName}
          isActive={isActive}
          maxOrgAdmins={maxOrgAdmins}
          error={error}
          updating={updating}
          setName={setOrgName}
          setIsActive={setIsActive}
          setMaxOrgAdmins={setMaxOrgAdmins}
          handleSubmit={handleUpdateOrg}
        />
      )}
    </div>
  );
}

// ── サマリーカード ──

function SummaryCard({
  label,
  value,
  sub,
  icon,
  variant = "default",
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  variant?: "default" | "warning";
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${variant === "warning" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className={`text-lg font-bold ${variant === "warning" ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}`}>
              {value}
            </p>
            {sub && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── 概要タブ ──

function OverviewTab({
  members,
  memberProgress,
  originalVideoIds,
  videos,
}: {
  members: Member[];
  memberProgress: Map<string, { completed: number; total: number }>;
  originalVideoIds: Set<number>;
  videos: Video[];
}) {
  const totalVideos = originalVideoIds.size;

  if (members.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        メンバーがいません
      </div>
    );
  }

  if (totalVideos === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        動画が割り当てられていません
      </div>
    );
  }

  // 未完了を先に、完了率でソート
  const sorted = [...members].sort((a, b) => {
    const pa = memberProgress.get(a.user_id) || { completed: 0, total: totalVideos };
    const pb = memberProgress.get(b.user_id) || { completed: 0, total: totalVideos };
    return (pa.completed / pa.total) - (pb.completed / pb.total);
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">メンバー進捗</h2>
      <Card>
        <CardContent>
          <div className="space-y-3">
            {sorted.map((m) => {
              const progress = memberProgress.get(m.user_id) || { completed: 0, total: totalVideos };
              const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
              const isComplete = pct === 100;

              return (
                <div key={m.user_id} className="flex items-center gap-4">
                  <div className="w-40 min-w-0 flex-shrink-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {m.profiles?.display_name || m.profiles?.email}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isComplete ? "bg-emerald-500" : "bg-da-blue-900"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-24 text-right flex-shrink-0">
                    <span className={`text-sm font-medium ${isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"}`}>
                      {progress.completed}/{progress.total} ({pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── 動画割り当てタブ ──

function LicensesTab({
  categories,
  videos,
  selectedVideoIds,
  expandedCategories,
  videoExpiresMap,
  expiresAt,
  saving,
  error,
  success,
  hasChanges,
  getVideosInCategory,
  isCategoryFullySelected,
  isCategoryPartiallySelected,
  toggleCategoryVideos,
  toggleVideo,
  toggleCategory,
  handleBulkExpiresChange,
  handleVideoExpiresChange,
  handleSave,
}: {
  categories: Category[];
  videos: Video[];
  selectedVideoIds: Set<number>;
  expandedCategories: Set<number>;
  videoExpiresMap: Map<number, string>;
  expiresAt: string;
  saving: boolean;
  error: string;
  success: string;
  hasChanges: boolean;
  getVideosInCategory: (id: number) => Video[];
  isCategoryFullySelected: (id: number) => boolean;
  isCategoryPartiallySelected: (id: number) => boolean;
  toggleCategoryVideos: (id: number) => void;
  toggleVideo: (id: number) => void;
  toggleCategory: (id: number) => void;
  handleBulkExpiresChange: (date: string) => void;
  handleVideoExpiresChange: (id: number, date: string) => void;
  handleSave: () => void;
}) {
  return (
    <div>
      {error && (
        <Card className="mb-4 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="py-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}
      {success && (
        <Card className="mb-4 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
          <CardContent className="py-3">
            <p className="text-sm text-da-success dark:text-emerald-400">{success}</p>
          </CardContent>
        </Card>
      )}

      <div className="mb-4">
        <Input
          id="expires_at"
          type="date"
          label="有効期限（一括設定）"
          value={expiresAt}
          onChange={(e) => handleBulkExpiresChange(e.target.value)}
          className="max-w-xs"
        />
        <p className="text-xs text-slate-500 mt-1">変更すると選択中の全動画に適用されます。個別設定は各動画行で変更できます。</p>
      </div>

      <Card className="mb-4">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {selectedVideoIds.size} / {videos.length} 動画を選択中
            </div>
          </div>

          <div className="space-y-2">
            {categories.map((category) => {
              const categoryVideos = getVideosInCategory(category.id);
              const isExpanded = expandedCategories.has(category.id);
              const isFullySelected = isCategoryFullySelected(category.id);
              const isPartiallySelected = isCategoryPartiallySelected(category.id);
              const selectedCount = categoryVideos.filter((v) => selectedVideoIds.has(v.id)).length;

              if (categoryVideos.length === 0) return null;

              return (
                <div key={category.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800/50">
                    <button
                      onClick={() => toggleCategoryVideos(category.id)}
                      className="flex items-center justify-center w-10 h-10 flex-shrink-0"
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${isFullySelected ? "bg-da-blue-900" : isPartiallySelected ? "bg-da-blue-900/50" : "bg-slate-300 dark:bg-slate-700"}`}>
                        {(isFullySelected || isPartiallySelected) && <CheckIcon className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="flex-1 flex items-center gap-3 py-3 pr-4 text-left"
                    >
                      <FolderIcon className={`w-5 h-5 ${isFullySelected ? "text-da-blue-900 dark:text-da-blue-300" : "text-da-gray-600"}`} />
                      <span className="font-medium text-slate-900 dark:text-white flex-1">{category.name}</span>
                      <span className="text-sm text-slate-500">{selectedCount}/{categoryVideos.length}</span>
                      {isExpanded
                        ? <ChevronDownIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        : <ChevronRightIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      }
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                      {categoryVideos.map((video) => {
                        const isSelected = selectedVideoIds.has(video.id);
                        const videoExpires = videoExpiresMap.get(video.id) || "";
                        return (
                          <div
                            key={video.id}
                            className={`flex items-center gap-3 w-full px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 last:border-b-0 transition-colors ${isSelected ? "bg-da-blue-50 dark:bg-da-blue-900/10" : "hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}
                          >
                            <button
                              onClick={() => toggleVideo(video.id)}
                              className="flex items-center gap-3 flex-1 min-w-0 text-left"
                            >
                              <div className="w-10 flex justify-center flex-shrink-0">
                                <div className={`w-4 h-4 rounded flex items-center justify-center ${isSelected ? "bg-da-blue-900" : "bg-slate-300 dark:bg-slate-700"}`}>
                                  {isSelected && <CheckIcon className="w-2.5 h-2.5 text-white" />}
                                </div>
                              </div>
                              <VideoIcon className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-da-blue-900 dark:text-da-blue-300" : "text-slate-500"}`} />
                              <span className={`truncate ${isSelected ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                                {video.title}
                              </span>
                            </button>
                            {isSelected && (
                              <input
                                type="date"
                                value={videoExpires}
                                onChange={(e) => handleVideoExpiresChange(video.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-shrink-0 text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-36"
                                title="個別の有効期限"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-8 text-slate-500">カテゴリがまだ登録されていません</div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "保存中..." : "保存"}
        </Button>
      </div>
    </div>
  );
}

// ── メンバータブ ──

function MembersTab({
  members,
  freeUsers,
  otherOrgUsers,
  memberError,
  createError,
  createSuccess,
  creating,
  adding,
  removeTargetId,
  handleCreateUser,
  handleAddMember,
  handleRemoveMember,
  handleChangeRole,
  setRemoveTargetId,
}: {
  members: Member[];
  freeUsers: Profile[];
  otherOrgUsers: (Profile & { orgName: string })[];
  memberError: string;
  createError: string;
  createSuccess: string;
  creating: boolean;
  adding: boolean;
  removeTargetId: string | null;
  handleCreateUser: (e: React.FormEvent<HTMLFormElement>) => void;
  handleAddMember: (e: React.FormEvent<HTMLFormElement>) => void;
  handleRemoveMember: () => void;
  handleChangeRole: (userId: string, newRole: string) => void;
  setRemoveTargetId: (id: string | null) => void;
}) {
  return (
    <div className="space-y-6">
      {/* ユーザー新規作成 */}
      <Card>
        <CardContent>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              ユーザーを作成して追加
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input name="email" type="email" label="メールアドレス" required placeholder="user@example.com" />
              <Input name="display_name" label="表示名" placeholder="山田 太郎" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input name="password" type="password" label="パスワード" required minLength={6} placeholder="6文字以上" />
              <Select name="role" label="ロール">
                <option value="org_admin">組織管理者</option>
                <option value="member">メンバー</option>
              </Select>
            </div>
            {createError && (
              <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
                <p className="text-xs text-red-600 dark:text-red-400">{createError}</p>
              </div>
            )}
            {createSuccess && (
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-800 rounded-lg">
                <p className="text-xs text-da-success dark:text-emerald-400">{createSuccess}</p>
              </div>
            )}
            <Button type="submit" size="sm" isLoading={creating}>
              {creating ? "作成中..." : "ユーザーを作成"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 既存ユーザー追加 */}
      <Card>
        <CardContent>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <UsersIcon className="w-4 h-4" />
              既存ユーザーを追加
            </div>
            {freeUsers.length === 0 && otherOrgUsers.length === 0 ? (
              <p className="text-sm text-slate-500">追加可能なユーザーがいません</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Select name="email" label="ユーザー" required>
                    <option value="">選択してください</option>
                    {freeUsers.length > 0 && (
                      <optgroup label="未所属">
                        {freeUsers.map((u) => (
                          <option key={u.id} value={u.email}>
                            {u.display_name || u.email} ({u.email})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {otherOrgUsers.length > 0 && (
                      <optgroup label="他組織から移動">
                        {otherOrgUsers.map((u) => (
                          <option key={u.id} value={u.email}>
                            {u.display_name || u.email} ({u.email}) — {u.orgName}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </Select>
                  <Select name="role" label="ロール">
                    <option value="org_admin">組織管理者</option>
                    <option value="member">メンバー</option>
                  </Select>
                </div>
                {memberError && (
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
                    <p className="text-xs text-red-600 dark:text-red-400">{memberError}</p>
                  </div>
                )}
                <Button type="submit" size="sm" variant="secondary" isLoading={adding}>
                  {adding ? "追加中..." : "追加"}
                </Button>
              </>
            )}
          </form>
        </CardContent>
      </Card>

      {/* メンバー一覧 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ユーザー</TableHead>
            <TableHead>ロール</TableHead>
            <TableHead className="text-right w-20">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => (
            <TableRow key={m.id}>
              <TableCell>
                <div className="text-slate-900 dark:text-white text-sm font-medium">
                  {m.profiles?.display_name}
                </div>
                <div className="text-slate-500 text-xs">{m.profiles?.email}</div>
              </TableCell>
              <TableCell>
                <select
                  value={m.role}
                  onChange={(e) => handleChangeRole(m.user_id, e.target.value)}
                  className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <option value="org_admin">管理者</option>
                  <option value="member">メンバー</option>
                </select>
              </TableCell>
              <TableCell className="text-right">
                {m.role !== "org_admin" && (
                  <button
                    onClick={() => setRemoveTargetId(m.user_id)}
                    className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-da-error dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
                    title="削除"
                  >
                    <TrashIcon />
                  </button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {members.length === 0 && <TableEmpty colSpan={3} message="メンバーがいません" />}
        </TableBody>
      </Table>

      <ConfirmModal
        open={removeTargetId !== null}
        title="メンバーを削除"
        message="このメンバーを組織から削除してもよろしいですか？"
        onConfirm={handleRemoveMember}
        onCancel={() => setRemoveTargetId(null)}
      />
    </div>
  );
}

// ── 設定タブ ──

function SettingsTab({
  name,
  isActive,
  maxOrgAdmins,
  error,
  updating,
  setName,
  setIsActive,
  setMaxOrgAdmins,
  handleSubmit,
}: {
  name: string;
  isActive: boolean;
  maxOrgAdmins: number;
  error: string;
  updating: boolean;
  setName: (v: string) => void;
  setIsActive: (v: boolean) => void;
  setMaxOrgAdmins: (v: number) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="max-w-lg">
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="name"
              label="組織名"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              name="max_org_admins"
              type="number"
              label="管理者上限数"
              min={1}
              max={10}
              required
              value={maxOrgAdmins}
              onChange={(e) => setMaxOrgAdmins(Number(e.target.value))}
            />
            <Switch
              name="is_active"
              checked={isActive}
              onChange={setIsActive}
              label="有効"
            />
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            <div className="pt-2">
              <Button type="submit" isLoading={updating}>
                {updating ? "更新中..." : "更新"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
