"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { listVideosWithCategory, listCategoryNames } from "@/lib/db";
import { createVideo, updateVideo, deleteVideo } from "./actions";
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui";
import { PlusIcon, PencilIcon, TrashIcon, ClockIcon } from "@/components/icons";

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
      <PageHeader
        title="動画管理"
        description="動画コンテンツを管理します"
        action={
          <Button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
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
        }
      />

      {error && (
        <Card className="mb-6 border-red-800 bg-red-900/20">
          <CardContent className="py-3">
            <p className="text-sm text-red-400">{error}</p>
          </CardContent>
        </Card>
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>タイトル</TableHead>
            <TableHead>カテゴリ</TableHead>
            <TableHead>時間</TableHead>
            <TableHead>公開</TableHead>
            <TableHead className="text-right w-32">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.map((video) => (
            <TableRow key={video.id}>
              <TableCell className="text-white font-medium">
                {video.title}
              </TableCell>
              <TableCell className="text-slate-400">
                {video.categories?.name}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-slate-400 font-mono text-sm">
                  <ClockIcon className="w-4 h-4" />
                  {formatDuration(video.duration)}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={video.is_published ? "success" : "default"}>
                  {video.is_published ? "公開" : "非公開"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => {
                      setEditingId(video.id);
                      setShowForm(false);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                    title="編集"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    onClick={() => handleDelete(video.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="削除"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {videos.length === 0 && (
            <TableEmpty colSpan={5} message="動画がまだ登録されていません" />
          )}
        </TableBody>
      </Table>
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

          <div className="grid grid-cols-3 gap-4">
            <Input
              name="cf_video_id"
              label="Cloudflare Video ID"
              required
              defaultValue={video?.cf_video_id}
              placeholder="abc123..."
              className="font-mono"
            />
            <Input
              name="duration"
              label="長さ（秒）"
              type="number"
              required
              defaultValue={video?.duration}
              placeholder="120"
            />
            <Input
              name="display_order"
              label="表示順"
              type="number"
              defaultValue={video?.display_order ?? 0}
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
