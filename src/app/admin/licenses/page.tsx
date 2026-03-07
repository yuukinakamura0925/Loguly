"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  listOrganizations,
  listVideosWithCategory,
  listCategories,
  listLicenseVideoIdsForOrg,
} from "@/lib/db";
import { updateOrgLicenses } from "./actions";
import {
  Button,
  Card,
  CardContent,
  Badge,
  PageHeader,
  Input,
} from "@/components/ui";
import {
  ArrowLeftIcon,
  CheckIcon,
  BuildingIcon,
  VideoIcon,
  FolderIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SortAscIcon,
  SortDescIcon,
} from "@/components/icons";

type Org = {
  id: string;
  name: string;
  is_active: boolean;
  organization_members: { count: number }[];
};

type Category = {
  id: number;
  name: string;
  display_order: number;
};

type Video = {
  id: number;
  title: string;
  category_id: number;
  display_order: number;
};

export default function LicensesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<number>>(new Set());
  const [originalVideoIds, setOriginalVideoIds] = useState<Set<number>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [sortAsc, setSortAsc] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [videoExpiresMap, setVideoExpiresMap] = useState<Map<number, string>>(new Map());

  function handleBulkExpiresChange(date: string) {
    setExpiresAt(date);
    setVideoExpiresMap((prev) => {
      const next = new Map(prev);
      selectedVideoIds.forEach((id) => {
        if (date) {
          next.set(id, date);
        } else {
          next.delete(id);
        }
      });
      return next;
    });
  }

  function handleVideoExpiresChange(videoId: number, date: string) {
    setVideoExpiresMap((prev) => {
      const next = new Map(prev);
      if (date) {
        next.set(videoId, date);
      } else {
        next.delete(videoId);
      }
      return next;
    });
  }

  useEffect(() => {
    let active = true;
    async function fetchData() {
      const [{ data: orgData }, { data: cats }, { data: vids }] = await Promise.all([
        listOrganizations(supabase),
        listCategories(supabase),
        listVideosWithCategory(supabase),
      ]);
      if (active) {
        setOrgs((orgData as Org[]) || []);
        setCategories((cats as Category[]) || []);
        setVideos((vids as Video[]) || []);
      }
    }
    fetchData();
    return () => { active = false; };
  }, [supabase, refreshKey]);

  function reload() {
    setRefreshKey((k) => k + 1);
  }

  async function selectOrg(org: Org) {
    setSelectedOrg(org);
    setError("");
    setSuccess("");

    // Load current licenses for this org
    const { data } = await listLicenseVideoIdsForOrg(supabase, org.id);
    const ids = new Set((data || []).map((l) => l.video_id));
    setSelectedVideoIds(ids);
    setOriginalVideoIds(new Set(ids));
    // 既存の有効期限を動画ごとにロード
    const expiresMap = new Map<number, string>();
    (data || []).forEach((l) => {
      if (l.expires_at) {
        expiresMap.set(l.video_id, l.expires_at.split("T")[0]);
      }
    });
    setVideoExpiresMap(expiresMap);
    // 全動画で共通の場合はその値を一括フィールドに表示
    const dates = [...new Set([...expiresMap.values()])];
    if (dates.length === 1) {
      setExpiresAt(dates[0]);
    } else {
      setExpiresAt("");
    }
    // Expand all categories by default
    setExpandedCategories(new Set(categories.map((c) => c.id)));
  }

  function toggleCategory(categoryId: number) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  function toggleVideo(videoId: number) {
    setSelectedVideoIds((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) {
        next.delete(videoId);
      } else {
        next.add(videoId);
      }
      return next;
    });
  }

  function getVideosInCategory(categoryId: number) {
    return videos.filter((v) => v.category_id === categoryId);
  }

  function isCategoryFullySelected(categoryId: number) {
    const categoryVideos = getVideosInCategory(categoryId);
    return categoryVideos.length > 0 && categoryVideos.every((v) => selectedVideoIds.has(v.id));
  }

  function isCategoryPartiallySelected(categoryId: number) {
    const categoryVideos = getVideosInCategory(categoryId);
    const selectedCount = categoryVideos.filter((v) => selectedVideoIds.has(v.id)).length;
    return selectedCount > 0 && selectedCount < categoryVideos.length;
  }

  function toggleCategoryVideos(categoryId: number) {
    const categoryVideos = getVideosInCategory(categoryId);
    const allSelected = isCategoryFullySelected(categoryId);

    setSelectedVideoIds((prev) => {
      const next = new Set(prev);
      categoryVideos.forEach((v) => {
        if (allSelected) {
          next.delete(v.id);
        } else {
          next.add(v.id);
        }
      });
      return next;
    });
  }

  async function handleSave() {
    if (!selectedOrg) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const expiresRecord: Record<string, string | null> = {};
      selectedVideoIds.forEach((id) => {
        expiresRecord[String(id)] = videoExpiresMap.get(id) || null;
      });
      const result = await updateOrgLicenses(
        selectedOrg.id,
        Array.from(selectedVideoIds),
        videos.map((v) => v.id),
        expiresRecord
      );

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("割り当てを更新しました");
        setOriginalVideoIds(new Set(selectedVideoIds));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存中にエラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  const hasChanges =
    selectedVideoIds.size !== originalVideoIds.size ||
    Array.from(selectedVideoIds).some((id) => !originalVideoIds.has(id));

  const filteredOrgs = orgs
    .filter((org) => org.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      return dir * a.name.localeCompare(b.name, "ja");
    });

  // Org selection view
  if (!selectedOrg) {
    return (
      <div>
        <PageHeader
          title="動画割り当て"
          description="組織を選択して動画を一括で割り当てます"
        />

        <div className="flex gap-3 items-end mb-6">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="組織名で検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            名前順
            {sortAsc
              ? <SortAscIcon className="w-3 h-3 text-da-blue-900 dark:text-da-blue-300" />
              : <SortDescIcon className="w-3 h-3 text-da-blue-900 dark:text-da-blue-300" />
            }
          </button>
          <span className="text-sm text-slate-500 pb-2">{filteredOrgs.length}件</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrgs.map((org) => {
            const memberCount = org.organization_members?.[0]?.count ?? 0;

            return (
              <Card
                key={org.id}
                className="cursor-pointer hover:border-da-blue-900 transition-colors"
                onClick={() => selectOrg(org)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg">
                        <BuildingIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{org.name}</div>
                        <div className="text-sm text-slate-500">{memberCount} メンバー</div>
                      </div>
                    </div>
                    <Badge variant={org.is_active ? "success" : "danger"}>
                      {org.is_active ? "有効" : "無効"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredOrgs.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            {search ? "検索結果がありません" : "組織がまだ登録されていません"}
          </div>
        )}
      </div>
    );
  }

  // Video license assignment view with category folders
  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => {
            setSelectedOrg(null);
            setSearch("");
          }}
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm transition-colors"
        >
          <ArrowLeftIcon />
          組織一覧に戻る
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{selectedOrg.name}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">カテゴリを開いて動画を選択してください</p>
      </div>

      {error && (
        <Card className="mb-6 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="py-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="mb-6 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
          <CardContent className="py-3">
            <p className="text-sm text-da-success dark:text-emerald-400">{success}</p>
          </CardContent>
        </Card>
      )}

      <div className="mb-6">
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

      <Card className="mb-6">
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
                  {/* Category header */}
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800/50">
                    <button
                      onClick={() => toggleCategoryVideos(category.id)}
                      className={`
                        flex items-center justify-center w-10 h-10 flex-shrink-0
                        ${isFullySelected ? "text-da-blue-900 dark:text-da-blue-300" : "text-slate-500"}
                      `}
                    >
                      <div
                        className={`
                          w-5 h-5 rounded flex items-center justify-center
                          ${isFullySelected ? "bg-da-blue-900" : isPartiallySelected ? "bg-da-blue-900/50" : "bg-slate-300 dark:bg-slate-700"}
                        `}
                      >
                        {(isFullySelected || isPartiallySelected) && (
                          <CheckIcon className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </button>

                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="flex-1 flex items-center gap-3 py-3 pr-4 text-left"
                    >
                      <FolderIcon className={`w-5 h-5 ${isFullySelected ? "text-da-blue-900 dark:text-da-blue-300" : "text-da-gray-600"}`} />
                      <span className="font-medium text-slate-900 dark:text-white flex-1">{category.name}</span>
                      <span className="text-sm text-slate-500">
                        {selectedCount}/{categoryVideos.length}
                      </span>
                      {isExpanded ? (
                        <ChevronDownIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      )}
                    </button>
                  </div>

                  {/* Videos in category */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                      {categoryVideos.map((video) => {
                        const isSelected = selectedVideoIds.has(video.id);
                        const videoExpires = videoExpiresMap.get(video.id) || "";

                        return (
                          <div
                            key={video.id}
                            className={`
                              flex items-center gap-3 w-full px-4 py-2.5
                              border-b border-slate-200 dark:border-slate-800 last:border-b-0
                              transition-colors
                              ${isSelected ? "bg-da-blue-50 dark:bg-da-blue-900/10" : "hover:bg-slate-100 dark:hover:bg-slate-800/50"}
                            `}
                          >
                            <button
                              onClick={() => toggleVideo(video.id)}
                              className="flex items-center gap-3 flex-1 min-w-0 text-left"
                            >
                              <div className="w-10 flex justify-center flex-shrink-0">
                                <div
                                  className={`
                                    w-4 h-4 rounded flex items-center justify-center
                                    ${isSelected ? "bg-da-blue-900" : "bg-slate-300 dark:bg-slate-700"}
                                  `}
                                >
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
            <div className="text-center py-8 text-slate-500">
              カテゴリがまだ登録されていません
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "保存中..." : "保存"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setSelectedOrg(null);
            setSearch("");
          }}
        >
          キャンセル
        </Button>
      </div>
    </div>
  );
}
