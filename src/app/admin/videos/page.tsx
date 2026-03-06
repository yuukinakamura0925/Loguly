"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { listVideosWithCategory, listCategories } from "@/lib/db";
import {
  createVideo,
  updateVideo,
  deleteVideo,
  reorderVideos,
  reorderCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./actions";
import {
  Button,
  Input,
  Select,
  Textarea,
  Switch,
  Card,
  CardContent,
  Badge,
  PageHeader,
} from "@/components/ui";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
} from "@/components/icons";

type Video = {
  id: number;
  category_id: number;
  title: string;
  description: string | null;
  cf_video_id: string;
  duration: number;
  display_order: number;
  is_published: boolean;
  categories: { name: string } | null;
};

type Category = {
  id: number;
  name: string;
  display_order: number;
};

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function VideosPage() {
  const supabase = createClient();
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      const [{ data: vids }, { data: cats }] = await Promise.all([
        listVideosWithCategory(supabase),
        listCategories(supabase),
      ]);
      if (active) {
        setVideos((vids as Video[]) || []);
        setCategories((cats as Category[]) || []);
      }
    }
    fetchData();
    return () => { active = false; };
  }, [supabase, refreshKey]);

  function reload() {
    setRefreshKey((k) => k + 1);
  }

  async function handleDelete(id: number) {
    setError("");
    const result = await deleteVideo(id);
    if (result.error) {
      setError(result.error);
    } else {
      reload();
    }
  }

  const [menuCategoryId, setMenuCategoryId] = useState<number | null>(null);
  const [menuVideoId, setMenuVideoId] = useState<number | null>(null);

  const closeAllMenus = useCallback(() => {
    setMenuCategoryId(null);
    setMenuVideoId(null);
  }, []);

  useEffect(() => {
    if (menuCategoryId === null && menuVideoId === null) return;
    const handler = () => closeAllMenus();
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuCategoryId, menuVideoId, closeAllMenus]);

  const [dragVideoId, setDragVideoId] = useState<number | null>(null);
  const [dragOverVideoId, setDragOverVideoId] = useState<number | null>(null);
  const [dragCategoryId, setDragCategoryId] = useState<number | null>(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState<number | null>(null);

  async function handleDrop(categoryId: number, targetVideoId: number) {
    if (dragVideoId === null || dragVideoId === targetVideoId) return;
    setError("");

    const categoryVids = videos
      .filter((v) => v.category_id === categoryId)
      .sort((a, b) => a.display_order - b.display_order);

    const orderedIds = categoryVids.map((v) => v.id);
    const fromIndex = orderedIds.indexOf(dragVideoId);
    const toIndex = orderedIds.indexOf(targetVideoId);
    if (fromIndex === -1 || toIndex === -1) return;

    orderedIds.splice(fromIndex, 1);
    orderedIds.splice(toIndex, 0, dragVideoId);

    const result = await reorderVideos(categoryId, orderedIds);
    if (result.error) {
      setError(result.error);
    } else {
      reload();
    }
    setDragVideoId(null);
    setDragOverVideoId(null);
  }

  async function handleDropCategory(targetCategoryId: number) {
    if (dragCategoryId === null || dragCategoryId === targetCategoryId) return;
    setError("");

    const orderedIds = categories.map((c) => c.id);
    const fromIndex = orderedIds.indexOf(dragCategoryId);
    const toIndex = orderedIds.indexOf(targetCategoryId);
    if (fromIndex === -1 || toIndex === -1) return;

    orderedIds.splice(fromIndex, 1);
    orderedIds.splice(toIndex, 0, dragCategoryId);

    const result = await reorderCategories(orderedIds);
    if (result.error) {
      setError(result.error);
    } else {
      reload();
    }
    setDragCategoryId(null);
    setDragOverCategoryId(null);
  }

  async function handleDeleteCategory(id: number) {
    const categoryVideos = videos.filter((v) => v.category_id === id);
    if (categoryVideos.length > 0) {
      setError("カテゴリに動画が含まれているため削除できません");
      return;
    }
    setError("");
    const result = await deleteCategory(id);
    if (result.error) {
      setError(result.error);
    } else {
      reload();
    }
  }

  async function moveVideo(categoryId: number, videoId: number, direction: "up" | "down") {
    setError("");
    const categoryVids = videos
      .filter((v) => v.category_id === categoryId)
      .sort((a, b) => a.display_order - b.display_order);
    const orderedIds = categoryVids.map((v) => v.id);
    const index = orderedIds.indexOf(videoId);
    if (index === -1) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= orderedIds.length) return;

    orderedIds.splice(index, 1);
    orderedIds.splice(newIndex, 0, videoId);

    const result = await reorderVideos(categoryId, orderedIds);
    if (result.error) setError(result.error);
    else reload();
  }

  async function moveAdminCategory(categoryId: number, direction: "up" | "down") {
    setError("");
    const orderedIds = categories.map((c) => c.id);
    const index = orderedIds.indexOf(categoryId);
    if (index === -1) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= orderedIds.length) return;

    orderedIds.splice(index, 1);
    orderedIds.splice(newIndex, 0, categoryId);

    const result = await reorderCategories(orderedIds);
    if (result.error) setError(result.error);
    else reload();
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

  // Group videos by category (show all categories including empty ones for management)
  const videosByCategory = categories.map((cat) => ({
    category: cat,
    videos: videos.filter((v) => v.category_id === cat.id),
  }));

  return (
    <div>
      <PageHeader
        title="動画管理"
        description="動画とカテゴリを管理します"
        action={
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setShowCategoryForm(!showCategoryForm);
                setEditingCategoryId(null);
                setShowForm(false);
                setEditingId(null);
              }}
              variant={showCategoryForm ? "secondary" : "secondary"}
            >
              {showCategoryForm ? (
                "キャンセル"
              ) : (
                <>
                  <FolderIcon className="w-4 h-4" />
                  カテゴリ追加
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                setShowForm(!showForm);
                setEditingId(null);
                setShowCategoryForm(false);
                setEditingCategoryId(null);
              }}
              variant={showForm ? "secondary" : "primary"}
            >
              {showForm ? (
                "キャンセル"
              ) : (
                <>
                  <PlusIcon />
                  動画を追加
                </>
              )}
            </Button>
          </div>
        }
      />

      {error && (
        <Card className="mb-6 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="py-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {(showCategoryForm || editingCategoryId !== null) && (
        <CategoryForm
          category={editingCategoryId !== null ? categories.find((c) => c.id === editingCategoryId) : undefined}
          nextOrder={categories.length > 0 ? Math.max(...categories.map((c) => c.display_order)) + 1 : 0}
          onSubmit={async (formData) => {
            setError("");
            const result = editingCategoryId !== null
              ? await updateCategory(editingCategoryId, formData)
              : await createCategory(formData);
            if (result.error) {
              setError(result.error);
            } else {
              setShowCategoryForm(false);
              setEditingCategoryId(null);
              reload();
            }
          }}
          onCancel={() => {
            setShowCategoryForm(false);
            setEditingCategoryId(null);
          }}
        />
      )}

      {(showForm || editingId !== null) && (
        <VideoForm
          categories={categories}
          videos={videos}
          video={editingId !== null ? videos.find((v) => v.id === editingId) : undefined}
          onSubmit={async (formData) => {
            setError("");
            const result = editingId !== null
              ? await updateVideo(editingId, formData)
              : await createVideo(formData);
            if (result.error) {
              setError(result.error);
            } else {
              setShowForm(false);
              setEditingId(null);
              reload();
            }
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        />
      )}

      <div className="space-y-4">
        {videosByCategory.map(({ category, videos: categoryVideos }) => {
          const isExpanded = expandedCategories.has(category.id);
          return (
          <Card
            key={category.id}
            draggable
            onDragStart={(e) => { e.stopPropagation(); setDragCategoryId(category.id); }}
            onDragEnd={() => { setDragCategoryId(null); setDragOverCategoryId(null); }}
            onDragOver={(e) => { e.preventDefault(); if (!dragVideoId) setDragOverCategoryId(category.id); }}
            onDrop={(e) => { e.preventDefault(); if (!dragVideoId) handleDropCategory(category.id); }}
            className={`${
              dragOverCategoryId === category.id && dragCategoryId !== category.id && !dragVideoId
                ? "ring-2 ring-da-blue-900"
                : dragCategoryId === category.id
                  ? "opacity-50"
                  : ""
            }`}
          >
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/50">
              {/* Category drag handle - desktop */}
              <div className="hidden lg:flex flex-shrink-0 pl-3 text-slate-400 dark:text-slate-600 cursor-grab active:cursor-grabbing">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="9" cy="6" r="1.5" />
                  <circle cx="15" cy="6" r="1.5" />
                  <circle cx="9" cy="12" r="1.5" />
                  <circle cx="15" cy="12" r="1.5" />
                  <circle cx="9" cy="18" r="1.5" />
                  <circle cx="15" cy="18" r="1.5" />
                </svg>
              </div>
              {/* Up/down buttons - mobile */}
              <div className="flex lg:hidden flex-shrink-0 pl-2 flex-col gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); moveAdminCategory(category.id, "up"); }}
                  disabled={videosByCategory.indexOf(videosByCategory.find(v => v.category.id === category.id)!) === 0}
                  className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6l-6 8h12l-6-8z" /></svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); moveAdminCategory(category.id, "down"); }}
                  disabled={videosByCategory.indexOf(videosByCategory.find(v => v.category.id === category.id)!) === videosByCategory.length - 1}
                  className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 14l-6-8h12l-6 8z" /></svg>
                </button>
              </div>
              <button
                onClick={() => toggleCategory(category.id)}
                className="flex-1 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 hover:bg-slate-200 dark:hover:bg-slate-800/70 transition-colors min-w-0"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                )}
                <FolderIcon className="w-5 h-5 text-da-gray-600 hidden sm:block flex-shrink-0" />
                <span className="font-medium text-slate-900 dark:text-white truncate">{category.name}</span>
                <span className="text-sm text-slate-500 flex-shrink-0">{categoryVideos.length}本</span>
              </button>
              {/* Edit/Delete - desktop */}
              <div className="hidden sm:flex gap-1 pr-4">
                <button
                  onClick={() => {
                    setEditingCategoryId(category.id);
                    setShowCategoryForm(false);
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  title="カテゴリを編集"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-da-error dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
                  title="カテゴリを削除"
                >
                  <TrashIcon />
                </button>
              </div>
              {/* ... menu - mobile */}
              <div className="relative sm:hidden pr-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuVideoId(null); setMenuCategoryId(menuCategoryId === category.id ? null : category.id); }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="10" cy="4" r="1.5" />
                    <circle cx="10" cy="10" r="1.5" />
                    <circle cx="10" cy="16" r="1.5" />
                  </svg>
                </button>
                {menuCategoryId === category.id && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                    <button
                      onClick={() => {
                        setEditingCategoryId(category.id);
                        setShowCategoryForm(false);
                        setShowForm(false);
                        setEditingId(null);
                        setMenuCategoryId(null);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <PencilIcon />
                      編集
                    </button>
                    <button
                      onClick={() => { handleDeleteCategory(category.id); setMenuCategoryId(null); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <TrashIcon />
                      削除
                    </button>
                  </div>
                )}
              </div>
            </div>
            {isExpanded && (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-700">
              {categoryVideos.length === 0 && (
                <div className="px-4 py-6 text-center text-slate-500 text-sm">
                  このカテゴリには動画がありません
                </div>
              )}
              {categoryVideos.map((video) => (
                <div
                  key={video.id}
                  draggable
                  onDragStart={() => setDragVideoId(video.id)}
                  onDragEnd={() => { setDragVideoId(null); setDragOverVideoId(null); }}
                  onDragOver={(e) => { e.preventDefault(); setDragOverVideoId(video.id); }}
                  onDrop={(e) => { e.preventDefault(); handleDrop(category.id, video.id); }}
                  className={`flex items-center gap-4 px-4 py-3 transition-colors cursor-grab active:cursor-grabbing ${
                    dragOverVideoId === video.id && dragVideoId !== video.id
                      ? "bg-slate-100 dark:bg-slate-800/60 border-t-2 border-da-blue-900"
                      : dragVideoId === video.id
                        ? "opacity-50 bg-slate-50 dark:bg-slate-800/30"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  }`}
                >
                  {/* Drag handle - desktop */}
                  <div className="hidden lg:flex flex-shrink-0 text-slate-400 dark:text-slate-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="9" cy="6" r="1.5" />
                      <circle cx="15" cy="6" r="1.5" />
                      <circle cx="9" cy="12" r="1.5" />
                      <circle cx="15" cy="12" r="1.5" />
                      <circle cx="9" cy="18" r="1.5" />
                      <circle cx="15" cy="18" r="1.5" />
                    </svg>
                  </div>

                  {/* Up/down buttons - mobile */}
                  <div className="flex lg:hidden flex-shrink-0 flex-col gap-0.5">
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveVideo(category.id, video.id, "up"); }}
                      disabled={categoryVideos.indexOf(video) === 0}
                      className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6l-6 8h12l-6-8z" /></svg>
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveVideo(category.id, video.id, "down"); }}
                      disabled={categoryVideos.indexOf(video) === categoryVideos.length - 1}
                      className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 14l-6-8h12l-6 8z" /></svg>
                    </button>
                  </div>

                  {/* Video thumbnail - desktop only */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); if (video.cf_video_id) setPreviewVideoId(video.cf_video_id); }}
                    className="relative w-24 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 group hidden sm:block"
                  >
                    {video.cf_video_id && process.env.NEXT_PUBLIC_VIDEO_BASE_URL ? (
                      <>
                        <video
                          src={`${process.env.NEXT_PUBLIC_VIDEO_BASE_URL}/${video.cf_video_id}`}
                          preload="metadata"
                          muted
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                          <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                  </button>

                  {/* Video info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-900 dark:text-white font-medium truncate text-sm sm:text-base">{video.title}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs sm:text-sm">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {formatDuration(video.duration)}
                      </div>
                      <Badge variant={video.is_published ? "success" : "default"} className="text-xs">
                        {video.is_published ? "公開" : "非公開"}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions - desktop */}
                  <div className="hidden sm:flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingId(video.id);
                        setShowForm(false);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                      title="編集"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-da-error dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
                      title="削除"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                  {/* ... menu - mobile */}
                  <div className="relative sm:hidden">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuCategoryId(null); setMenuVideoId(menuVideoId === video.id ? null : video.id); }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <circle cx="10" cy="4" r="1.5" />
                        <circle cx="10" cy="10" r="1.5" />
                        <circle cx="10" cy="16" r="1.5" />
                      </svg>
                    </button>
                    {menuVideoId === video.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                        <button
                          onClick={() => { setEditingId(video.id); setShowForm(false); setMenuVideoId(null); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <PencilIcon />
                          編集
                        </button>
                        <button
                          onClick={() => { handleDelete(video.id); setMenuVideoId(null); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <TrashIcon />
                          削除
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            )}
          </Card>
        );
        })}

        {categories.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              カテゴリがまだ登録されていません。「カテゴリ追加」ボタンから追加してください。
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview modal */}
      {previewVideoId && process.env.NEXT_PUBLIC_VIDEO_BASE_URL && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setPreviewVideoId(null)}
        >
          <div
            className="relative w-full max-w-3xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewVideoId(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white text-sm"
            >
              閉じる
            </button>
            <video
              src={`${process.env.NEXT_PUBLIC_VIDEO_BASE_URL}/${previewVideoId}`}
              controls
              autoPlay
              className="w-full rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

function VideoForm({
  categories,
  videos,
  video,
  onSubmit,
  onCancel,
}: {
  categories: Category[];
  videos: Video[];
  video?: Video;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [isPublished, setIsPublished] = useState(video?.is_published ?? false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    video?.category_id ?? null
  );
  const [uploadedVideoId, setUploadedVideoId] = useState(video?.cf_video_id || "");
  const [detectedDuration, setDetectedDuration] = useState(video?.duration || 0);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const getNextDisplayOrder = (categoryId: number) => {
    const categoryVideos = videos.filter((v) => v.category_id === categoryId);
    if (categoryVideos.length === 0) return 1;
    return Math.max(...categoryVideos.map((v) => v.display_order)) + 1;
  };

  const [displayOrder, setDisplayOrder] = useState(
    video?.display_order ?? (video?.category_id ? getNextDisplayOrder(video.category_id) : 1)
  );

  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
    if (categoryId && !video) {
      setDisplayOrder(getNextDisplayOrder(categoryId));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");

    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      setUploadError("MP4、MOV、WebM形式のみアップロード可能です");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError("ファイルサイズは2GB以下にしてください");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);

    // duration自動検出:
    // 非表示の<video>要素を作ってファイルを読み込み、メタデータからdurationを取得。
    // これによりdurationフィールドを手入力する必要がなくなる。
    const videoEl = document.createElement("video");
    videoEl.preload = "metadata";
    videoEl.onloadedmetadata = () => {
      setDetectedDuration(Math.floor(videoEl.duration));
      URL.revokeObjectURL(videoEl.src); // メモリリーク防止
    };
    videoEl.src = URL.createObjectURL(file);
  };

  /**
   * アップロード処理（2段階）
   *
   * 1. Next.js API Route にファイル名を送って、署名付きアップロードURLを取得
   * 2. そのURLにブラウザから直接動画ファイルをPUT（サーバーを経由しない）
   *
   * fetch() ではなく XMLHttpRequest を使う理由:
   * fetch() には upload.onprogress に相当するAPIがないため、
   * アップロード進捗（%）を取得するには XMLHttpRequest が必要。
   */
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadError("");
    setUploadProgress(0);

    try {
      // Step 1: サーバーから署名付きURLを取得
      const urlRes = await fetch("/api/videos/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: selectedFile.name }),
      });

      if (!urlRes.ok) {
        throw new Error("アップロードURLの取得に失敗しました");
      }

      const { videoId, uploadUrl } = await urlRes.json();

      // Step 2: 署名付きURLに動画ファイルを直接PUT
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`アップロードに失敗しました (${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("ネットワークエラーが発生しました"));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", selectedFile.type);
        xhr.send(selectedFile); // ← ファイルをR2/Streamに直接送信
      });

      // アップロード成功: videoIdをhidden inputにセット → フォーム送信時にDBに保存される
      setUploadedVideoId(videoId);
      setUploadProgress(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "アップロードに失敗しました");
      setUploadProgress(null);
    }
  };

  const isUploading = uploadProgress !== null;
  const hasVideo = !!uploadedVideoId;

  return (
    <Card className="mb-6">
      <CardContent>
        <form action={onSubmit} className="space-y-4">
          <input type="hidden" name="cf_video_id" value={uploadedVideoId} />
          <input type="hidden" name="duration" value={detectedDuration} />

          <div className="grid grid-cols-2 gap-4">
            <Input
              name="title"
              label="タイトル"
              required
              defaultValue={video?.title}
              placeholder="動画タイトル"
            />
            <Select
              name="category_id"
              label="カテゴリ"
              required
              defaultValue={video?.category_id}
              onChange={(e) => handleCategoryChange(parseInt(e.target.value) || null)}
            >
              <option value="">選択してください</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            name="description"
            label="説明"
            rows={2}
            defaultValue={video?.description || ""}
            placeholder="動画の説明（任意）"
          />

          {/* 動画ファイルアップロード */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              動画ファイル {!video && <span className="text-red-500">*</span>}
            </label>

            {hasVideo && !selectedFile ? (
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <svg className="w-5 h-5 text-da-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                  {video ? "アップロード済み" : "アップロード完了"}
                </span>
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); setUploadedVideoId(""); }}
                  className="ml-auto text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  変更
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-900 file:text-white hover:file:bg-slate-800 dark:file:bg-slate-700 dark:hover:file:bg-slate-600 file:cursor-pointer"
                />

                {selectedFile && !isUploading && !uploadedVideoId && (
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-500">
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
                      {detectedDuration > 0 && ` · ${Math.floor(detectedDuration / 60)}:${(detectedDuration % 60).toString().padStart(2, "0")}`}
                    </div>
                    <Button type="button" onClick={handleUpload} variant="secondary">
                      アップロード
                    </Button>
                  </div>
                )}

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">アップロード中...</span>
                      <span className="font-medium text-slate-900 dark:text-white">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-da-blue-900 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {uploadError && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{uploadError}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              name="display_order"
              label="表示順"
              type="number"
              min={1}
              required
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
            />
            {detectedDuration > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  再生時間
                </label>
                <div className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  {Math.floor(detectedDuration / 60)}:{(detectedDuration % 60).toString().padStart(2, "0")}
                </div>
              </div>
            )}
          </div>

          <Switch
            name="is_published"
            checked={isPublished}
            onChange={setIsPublished}
            label="公開"
          />

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={!video && !uploadedVideoId}>
              {video ? "更新" : "追加"}
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel}>
              キャンセル
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function CategoryForm({
  category,
  nextOrder,
  onSubmit,
  onCancel,
}: {
  category?: Category;
  nextOrder: number;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}) {
  return (
    <Card className="mb-6">
      <CardContent>
        <form action={onSubmit} className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <FolderIcon className="w-5 h-5 text-da-gray-600" />
            <span className="font-medium text-slate-900 dark:text-white">
              {category ? "カテゴリを編集" : "新しいカテゴリ"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="name"
              label="カテゴリ名"
              required
              defaultValue={category?.name}
              placeholder="入門編"
            />
            <Input
              name="display_order"
              label="表示順"
              type="number"
              defaultValue={category?.display_order ?? nextOrder}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit">
              {category ? "更新" : "追加"}
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel}>
              キャンセル
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
