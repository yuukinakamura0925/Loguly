"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { listVideosWithCategory, listCategories } from "@/lib/db";
import {
  createVideo,
  updateVideo,
  deleteVideo,
  moveVideo,
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
  ChevronUpIcon,
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
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [{ data: vids }, { data: cats }] = await Promise.all([
      listVideosWithCategory(supabase),
      listCategories(supabase),
    ]);
    setVideos((vids as Video[]) || []);
    setCategories((cats as Category[]) || []);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: number) {
    setError("");
    const result = await deleteVideo(id);
    if (result.error) {
      setError(result.error);
    } else {
      load();
    }
  }

  async function handleMove(id: number, direction: "up" | "down") {
    setError("");
    const result = await moveVideo(id, direction);
    if (result.error) {
      setError(result.error);
    } else {
      load();
    }
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
      load();
    }
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
              load();
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
              load();
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
          <Card key={category.id}>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/50">
              <button
                onClick={() => toggleCategory(category.id)}
                className="flex-1 flex items-center gap-3 px-4 py-3 hover:bg-slate-200 dark:hover:bg-slate-800/70 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                )}
                <FolderIcon className="w-5 h-5 text-yellow-500" />
                <span className="font-medium text-slate-900 dark:text-white">{category.name}</span>
                <span className="text-sm text-slate-500">{categoryVideos.length}本</span>
              </button>
              <div className="flex gap-1 pr-4">
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
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="カテゴリを削除"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
            {isExpanded && (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-700">
              {categoryVideos.length === 0 && (
                <div className="px-4 py-6 text-center text-slate-500 text-sm">
                  このカテゴリには動画がありません
                </div>
              )}
              {categoryVideos.map((video, index) => (
                <div
                  key={video.id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => handleMove(video.id, "up")}
                      disabled={index === 0}
                      className={`p-1 rounded transition-all ${
                        index === 0
                          ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                      title="上へ"
                    >
                      <ChevronUpIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMove(video.id, "down")}
                      disabled={index === categoryVideos.length - 1}
                      className={`p-1 rounded transition-all ${
                        index === categoryVideos.length - 1
                          ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                      title="下へ"
                    >
                      <ChevronDownIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Video info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-900 dark:text-white font-medium truncate">{video.title}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {formatDuration(video.duration)}
                      </div>
                      <Badge variant={video.is_published ? "success" : "default"} className="text-xs">
                        {video.is_published ? "公開" : "非公開"}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
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
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="削除"
                    >
                      <TrashIcon />
                    </button>
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
    </div>
  );
}

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

  // Calculate next display_order for selected category
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

  return (
    <Card className="mb-6">
      <CardContent>
        <form action={onSubmit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <Input
              name="cf_video_id"
              label="Cloudflare Video ID"
              required
              defaultValue={video?.cf_video_id}
              placeholder="abc123..."
              className="font-mono"
            />
            <Input
              name="display_order"
              label="表示順"
              type="number"
              min={1}
              required
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
            />
          </div>

          <Switch
            name="is_published"
            checked={isPublished}
            onChange={setIsPublished}
            label="公開"
          />

          <div className="flex gap-2 pt-2">
            <Button type="submit">
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
            <FolderIcon className="w-5 h-5 text-yellow-500" />
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
