"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { listVideosWithCategory, listCategoryNames } from "@/lib/db";
import { createVideo, updateVideo, deleteVideo } from "./actions";

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
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [{ data: vids }, { data: cats }] = await Promise.all([
      listVideosWithCategory(supabase),
      listCategoryNames(supabase),
    ]);
    setVideos((vids as Video[]) || []);
    setCategories((cats as Category[]) || []);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(formData: FormData) {
    setError("");
    const result = await createVideo(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setShowForm(false);
      load();
    }
  }

  async function handleDelete(id: number) {
    setError("");
    const result = await deleteVideo(id);
    if (result.error) {
      setError(result.error);
    } else {
      load();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">動画管理</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          {showForm ? "キャンセル" : "動画を追加"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {(showForm || editingId !== null) && (
        <VideoForm
          categories={categories}
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

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                タイトル
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                カテゴリ
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                時間
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                公開
              </th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr
                key={video.id}
                className="border-b border-gray-700 last:border-b-0"
              >
                <td className="px-4 py-3 text-white">{video.title}</td>
                <td className="px-4 py-3 text-gray-400">
                  {video.categories?.name}
                </td>
                <td className="px-4 py-3 text-gray-400 font-mono text-sm">
                  {formatDuration(video.duration)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      video.is_published
                        ? "bg-green-900 text-green-300"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {video.is_published ? "公開" : "非公開"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      setEditingId(video.id);
                      setShowForm(false);
                    }}
                    className="text-blue-400 hover:text-blue-300 text-sm mr-3"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(video.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
            {videos.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  動画がまだ登録されていません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VideoForm({
  categories,
  video,
  onSubmit,
  onCancel,
}: {
  categories: Category[];
  video?: Video;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [isPublished, setIsPublished] = useState(video?.is_published ?? false);

  return (
    <form
      action={onSubmit}
      className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">タイトル</label>
          <input
            name="title"
            required
            defaultValue={video?.title}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">カテゴリ</label>
          <select
            name="category_id"
            required
            defaultValue={video?.category_id}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
          >
            <option value="">選択してください</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">説明</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={video?.description || ""}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Cloudflare Video ID
          </label>
          <input
            name="cf_video_id"
            required
            defaultValue={video?.cf_video_id}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            長さ（秒）
          </label>
          <input
            name="duration"
            type="number"
            required
            defaultValue={video?.duration}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">表示順</label>
          <input
            name="display_order"
            type="number"
            defaultValue={video?.display_order ?? 0}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="hidden" name="is_published" value={isPublished ? "true" : "false"} />
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
        </label>
        <span className="text-sm text-gray-300">公開</span>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
        >
          {video ? "更新" : "追加"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 text-sm"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
