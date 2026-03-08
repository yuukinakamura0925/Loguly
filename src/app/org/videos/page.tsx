"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  listLicensedVideosForOrg,
  listCategories,
  listOrgCategoryOrder,
} from "@/lib/db";
import { reorderOrgVideos, reorderOrgCategories, resetOrgDisplayOrder, updateVideoLabel } from "./actions";
import { Card, CardContent, Button } from "@/components/ui";
import { GripIcon, ChevronUpIcon, ChevronDownIcon, CirclePlayIcon, ChevronRightIcon, PencilIcon } from "@/components/icons";

type Video = {
  id: number;
  title: string;
  duration: number;
  display_order: number;
  orgDisplayOrder: number | null;
  label: string | null;
  labelColor: string | null;
  categories: { name: string; display_order: number } | null;
};

const LABEL_COLORS = [
  { key: "gray", bg: "bg-slate-200 dark:bg-slate-700", text: "text-slate-700 dark:text-slate-300", dot: "bg-slate-400" },
  { key: "blue", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
  { key: "green", bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  { key: "yellow", bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  { key: "red", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", dot: "bg-red-500" },
  { key: "purple", bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", dot: "bg-purple-500" },
] as const;

function getLabelColorStyle(colorKey: string | null) {
  return LABEL_COLORS.find((c) => c.key === colorKey) || LABEL_COLORS[0];
}

type CategoryGroup = {
  id: number;
  name: string;
  globalOrder: number;
  orgOrder: number | null;
  videos: Video[];
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function OrgVideosPage() {
  const supabase = createClient();
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasCustomOrder, setHasCustomOrder] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);

  // Label editing state
  const [editingLabelVideoId, setEditingLabelVideoId] = useState<number | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState("");
  const [editingLabelColor, setEditingLabelColor] = useState<string | null>(null);

  // Drag state
  const [dragVideoId, setDragVideoId] = useState<number | null>(null);
  const [dragOverVideoId, setDragOverVideoId] = useState<number | null>(null);
  const [dragCategoryId, setDragCategoryId] = useState<number | null>(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (!membership || !active) return;
      const orgId = membership.organization_id;

      const [{ data: licenses }, { data: categories }, { data: orgCatOrders }] = await Promise.all([
        listLicensedVideosForOrg(supabase, orgId),
        listCategories(supabase),
        listOrgCategoryOrder(supabase, orgId),
      ]);

      const orgCatOrderMap = new Map(
        (orgCatOrders || []).map((o: { category_id: number; display_order: number }) => [o.category_id, o.display_order])
      );

      const videos: Video[] = (licenses || [])
        .map((l: Record<string, unknown>) => {
          const v = l.videos as Record<string, unknown> | null;
          if (!v) return null;
          return { ...v, orgDisplayOrder: l.display_order as number | null, label: (l.label as string | null) ?? null, labelColor: (l.label_color as string | null) ?? null } as Video;
        })
        .filter(Boolean) as Video[];

      const hasOrgOrder = videos.some((v) => v.orgDisplayOrder !== null) || (orgCatOrders && orgCatOrders.length > 0);
      if (active) setHasCustomOrder(!!hasOrgOrder);

      // Build category lookup
      const catById = new Map((categories || []).map((c: { id: number; name: string; display_order: number }) => [c.id, c]));

      // Group by category
      const categoryMap = new Map<number, Video[]>();
      for (const video of videos) {
        const catName = video.categories?.name || "";
        let catId = 0;
        for (const [id, cat] of catById) {
          if ((cat as { name: string }).name === catName) { catId = id; break; }
        }
        if (!categoryMap.has(catId)) categoryMap.set(catId, []);
        categoryMap.get(catId)!.push(video);
      }

      const groups: CategoryGroup[] = [];
      for (const [catId, catVideos] of categoryMap) {
        const cat = catById.get(catId) as { id: number; name: string; display_order: number } | undefined;
        if (!cat) continue;
        groups.push({
          id: cat.id,
          name: cat.name,
          globalOrder: cat.display_order,
          orgOrder: orgCatOrderMap.get(cat.id) ?? null,
          videos: catVideos.sort((a, b) => {
            const aOrder = a.orgDisplayOrder ?? a.display_order;
            const bOrder = b.orgDisplayOrder ?? b.display_order;
            return aOrder - bOrder;
          }),
        });
      }

      groups.sort((a, b) => {
        const aOrder = a.orgOrder ?? a.globalOrder;
        const bOrder = b.orgOrder ?? b.globalOrder;
        return aOrder - bOrder;
      });

      if (active) {
        setCategoryGroups(groups);
        setExpandedCategories(new Set(groups.map((g) => g.id)));
        setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [supabase, refreshKey]);

  function reload() { setRefreshKey((k) => k + 1); }

  function toggleCategory(categoryId: number) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  async function handleDropVideo(categoryId: number, targetVideoId: number) {
    if (dragVideoId === null || dragVideoId === targetVideoId) return;
    setError("");
    const group = categoryGroups.find((g) => g.id === categoryId);
    if (!group) return;

    const orderedIds = group.videos.map((v) => v.id);
    const fromIndex = orderedIds.indexOf(dragVideoId);
    const toIndex = orderedIds.indexOf(targetVideoId);
    if (fromIndex === -1 || toIndex === -1) return;

    orderedIds.splice(fromIndex, 1);
    orderedIds.splice(toIndex, 0, dragVideoId);

    const result = await reorderOrgVideos(orderedIds);
    if (result.error) setError(result.error);
    else reload();
    setDragVideoId(null);
    setDragOverVideoId(null);
  }

  async function handleDropCategory(targetCategoryId: number) {
    if (dragCategoryId === null || dragCategoryId === targetCategoryId) return;
    setError("");

    const orderedIds = categoryGroups.map((g) => g.id);
    const fromIndex = orderedIds.indexOf(dragCategoryId);
    const toIndex = orderedIds.indexOf(targetCategoryId);
    if (fromIndex === -1 || toIndex === -1) return;

    orderedIds.splice(fromIndex, 1);
    orderedIds.splice(toIndex, 0, dragCategoryId);

    const result = await reorderOrgCategories(orderedIds);
    if (result.error) setError(result.error);
    else reload();
    setDragCategoryId(null);
    setDragOverCategoryId(null);
  }

  async function moveVideo(categoryId: number, videoId: number, direction: "up" | "down") {
    setError("");
    const group = categoryGroups.find((g) => g.id === categoryId);
    if (!group) return;

    const orderedIds = group.videos.map((v) => v.id);
    const index = orderedIds.indexOf(videoId);
    if (index === -1) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= orderedIds.length) return;

    orderedIds.splice(index, 1);
    orderedIds.splice(newIndex, 0, videoId);

    const result = await reorderOrgVideos(orderedIds);
    if (result.error) setError(result.error);
    else reload();
  }

  async function moveCategory(categoryId: number, direction: "up" | "down") {
    setError("");
    const orderedIds = categoryGroups.map((g) => g.id);
    const index = orderedIds.indexOf(categoryId);
    if (index === -1) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= orderedIds.length) return;

    orderedIds.splice(index, 1);
    orderedIds.splice(newIndex, 0, categoryId);

    const result = await reorderOrgCategories(orderedIds);
    if (result.error) setError(result.error);
    else reload();
  }

  async function handleReset() {
    setError("");
    const result = await resetOrgDisplayOrder();
    if (result.error) setError(result.error);
    else reload();
  }

  function startEditLabel(videoId: number, currentLabel: string | null, currentColor: string | null) {
    setEditingLabelVideoId(videoId);
    setEditingLabelValue(currentLabel || "");
    setEditingLabelColor(currentColor || "gray");
  }

  async function saveLabel(videoId: number) {
    setError("");
    const result = await updateVideoLabel(videoId, editingLabelValue, editingLabelColor);
    if (result.error) setError(result.error);
    else reload();
    setEditingLabelVideoId(null);
  }

  const totalVideos = categoryGroups.reduce((sum, g) => sum + g.videos.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">動画プレビュー</h1>
          <p className="text-sm text-slate-500 mt-1">
            表示順を変更できます（{totalVideos}本）
          </p>
        </div>
        {hasCustomOrder && (
          <Button variant="secondary" onClick={handleReset}>
            デフォルトに戻す
          </Button>
        )}
      </div>

      {error && (
        <Card className="mb-6 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="py-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {categoryGroups.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-slate-500 text-center py-8">
              割り当てられた動画がありません
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {categoryGroups.map((group) => {
            const isExpanded = expandedCategories.has(group.id);
            return (
              <Card
                key={group.id}
                draggable
                onDragStart={(e) => { e.stopPropagation(); setDragCategoryId(group.id); }}
                onDragEnd={() => { setDragCategoryId(null); setDragOverCategoryId(null); }}
                onDragOver={(e) => { e.preventDefault(); if (!dragVideoId) setDragOverCategoryId(group.id); }}
                onDrop={(e) => { e.preventDefault(); if (!dragVideoId) handleDropCategory(group.id); }}
                className={`${
                  dragOverCategoryId === group.id && dragCategoryId !== group.id && !dragVideoId
                    ? "ring-2 ring-da-blue-900"
                    : dragCategoryId === group.id
                      ? "opacity-50"
                      : ""
                }`}
              >
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/50">
                  {/* Category drag handle - desktop */}
                  <div className="hidden lg:flex flex-shrink-0 pl-3 text-slate-400 dark:text-slate-600 cursor-grab active:cursor-grabbing">
                    <GripIcon className="w-5 h-5" />
                  </div>
                  {/* Up/down buttons - mobile */}
                  <div className="flex lg:hidden flex-shrink-0 pl-2 flex-col gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveCategory(group.id, "up"); }}
                      disabled={categoryGroups.indexOf(group) === 0}
                      className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700 disabled:opacity-30"
                    >
                      <ChevronUpIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveCategory(group.id, "down"); }}
                      disabled={categoryGroups.indexOf(group) === categoryGroups.length - 1}
                      className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700 disabled:opacity-30"
                    >
                      <ChevronDownIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => toggleCategory(group.id)}
                    className="flex-1 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 hover:bg-slate-200 dark:hover:bg-slate-800/70 active:bg-slate-300 dark:active:bg-slate-700 transition-colors min-w-0"
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                    )}
                    <span className="font-medium text-slate-900 dark:text-white truncate">{group.name}</span>
                    <span className="text-sm text-slate-500 flex-shrink-0">{group.videos.length}本</span>
                  </button>
                </div>

                {isExpanded && (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-700">
                    {group.videos.map((video) => (
                      <div
                        key={video.id}
                        draggable
                        onDragStart={(e) => { e.stopPropagation(); setDragVideoId(video.id); }}
                        onDragEnd={() => { setDragVideoId(null); setDragOverVideoId(null); }}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverVideoId(video.id); }}
                        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDropVideo(group.id, video.id); }}
                        className={`flex items-center gap-4 px-4 py-3 transition-colors cursor-grab active:cursor-grabbing ${
                          dragOverVideoId === video.id && dragVideoId !== video.id
                            ? "bg-slate-100 dark:bg-slate-800/60 border-t-2 border-da-blue-900"
                            : dragVideoId === video.id
                              ? "opacity-50 bg-slate-50 dark:bg-slate-800/30"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                        }`}
                      >
                        <div className="hidden lg:flex flex-shrink-0 text-slate-400 dark:text-slate-600">
                          <GripIcon className="w-5 h-5" />
                        </div>

                        <div className="flex lg:hidden flex-shrink-0 flex-col gap-0.5">
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveVideo(group.id, video.id, "up"); }}
                            disabled={group.videos.indexOf(video) === 0}
                            className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700 disabled:opacity-30"
                          >
                            <ChevronUpIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveVideo(group.id, video.id, "down"); }}
                            disabled={group.videos.indexOf(video) === group.videos.length - 1}
                            className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700 disabled:opacity-30"
                          >
                            <ChevronDownIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <CirclePlayIcon className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <Link href={`/org/videos/${video.id}`} className="group active:opacity-70 transition-opacity">
                            <div className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-da-blue-900 dark:group-hover:text-da-blue-300 transition-colors">
                              {video.title}
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatDuration(video.duration)}
                            </div>
                          </Link>
                          {/* Label display / edit */}
                          {editingLabelVideoId === video.id ? (
                            <div className="mt-1 space-y-1.5">
                              <input
                                type="text"
                                value={editingLabelValue}
                                onChange={(e) => setEditingLabelValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveLabel(video.id);
                                  if (e.key === "Escape") setEditingLabelVideoId(null);
                                }}
                                maxLength={50}
                                autoFocus
                                placeholder="ラベルを入力（50文字以内）"
                                className="w-full max-w-xs px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white placeholder-slate-400"
                                onClick={(e) => e.stopPropagation()}
                                onDragStart={(e) => e.stopPropagation()}
                              />
                              <div className="flex items-center gap-1.5">
                                {LABEL_COLORS.map((c) => (
                                  <button
                                    key={c.key}
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setEditingLabelColor(c.key); }}
                                    className={`w-5 h-5 rounded-full ${c.dot} ${editingLabelColor === c.key ? "ring-2 ring-offset-1 ring-slate-900 dark:ring-white dark:ring-offset-slate-900" : ""}`}
                                    title={c.key}
                                  />
                                ))}
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); saveLabel(video.id); }}
                                  className="ml-2 px-2 py-0.5 text-xs bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded hover:opacity-80"
                                >
                                  保存
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEditLabel(video.id, video.label, video.labelColor); }}
                              className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-da-blue-900 dark:hover:text-da-blue-300 active:opacity-70 transition-colors"
                            >
                              {video.label ? (() => {
                                const style = getLabelColorStyle(video.labelColor);
                                return (
                                  <span className={`px-1.5 py-0.5 ${style.bg} ${style.text} rounded`}>
                                    {video.label}
                                  </span>
                                );
                              })() : (
                                <>
                                  <PencilIcon className="w-3 h-3" />
                                  ラベルを追加
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <ChevronRightIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
