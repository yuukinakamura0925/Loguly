"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { listCategories, listVideosWithCategory } from "@/lib/db";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "./actions";
import { reorderCategories } from "../videos/actions";
import {
  Button,
  Input,
  Card,
  CardContent,
  PageHeader,
  ConfirmModal,
} from "@/components/ui";
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XIcon, FolderIcon, GripIcon, ChevronUpIcon, ChevronDownIcon, MoreVerticalIcon, VideoIcon, AlertTriangleIcon } from "@/components/icons";

type Category = {
  id: number;
  name: string;
  display_order: number;
};

export default function CategoriesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [videoCounts, setVideoCounts] = useState<Map<number, number>>(new Map());
  const [totalVideoCount, setTotalVideoCount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const [menuId, setMenuId] = useState<number | null>(null);

  const closeAllMenus = useCallback(() => setMenuId(null), []);

  useEffect(() => {
    if (menuId === null) return;
    const handler = () => closeAllMenus();
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuId, closeAllMenus]);

  // D&D state
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      const [{ data }, { data: vids }] = await Promise.all([
        listCategories(supabase),
        listVideosWithCategory(supabase),
      ]);
      if (!active) return;
      setCategories((data as Category[]) || []);

      // カテゴリ別の動画数を集計
      const countMap = new Map<number, number>();
      for (const v of (vids || []) as { category_id: number }[]) {
        countMap.set(v.category_id, (countMap.get(v.category_id) || 0) + 1);
      }
      setVideoCounts(countMap);
      setTotalVideoCount((vids || []).length);
    }
    fetchData();
    return () => { active = false; };
  }, [supabase, refreshKey]);

  function reload() {
    setRefreshKey((k) => k + 1);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const formData = new FormData(e.currentTarget);
      const result = await createCategory(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setShowForm(false);
        reload();
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(id: number, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUpdating(true);
    setError("");
    try {
      const formData = new FormData(e.currentTarget);
      const result = await updateCategory(id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setEditingId(null);
        reload();
      }
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (deleteTargetId === null) return;
    setDeleting(true);
    setError("");
    const result = await deleteCategory(deleteTargetId);
    if (result.error) {
      setError(result.error);
    } else {
      reload();
    }
    setDeleting(false);
    setDeleteTargetId(null);
  }

  async function handleDrop(targetId: number) {
    if (dragId === null || dragId === targetId) return;
    setError("");

    const orderedIds = categories.map((c) => c.id);
    const fromIndex = orderedIds.indexOf(dragId);
    const toIndex = orderedIds.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    orderedIds.splice(fromIndex, 1);
    orderedIds.splice(toIndex, 0, dragId);

    const result = await reorderCategories(orderedIds);
    if (result.error) {
      setError(result.error);
    } else {
      reload();
    }
    setDragId(null);
    setDragOverId(null);
  }

  async function moveCategory(categoryId: number, direction: "up" | "down") {
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

  const nextOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.display_order)) + 1 : 1;

  return (
    <div>
      <PageHeader
        title="カテゴリ管理"
        description="動画のカテゴリを管理します。ドラッグで並び替えできます。"
        action={
          <Button onClick={() => { setShowForm(!showForm); setEditingId(null); }} variant={showForm ? "secondary" : "primary"}>
            {showForm ? (
              <>
                <XIcon />
                キャンセル
              </>
            ) : (
              <>
                <PlusIcon />
                カテゴリを追加
              </>
            )}
          </Button>
        }
      />

      {/* サマリーカード */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                <FolderIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">カテゴリ数</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                <VideoIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">全カテゴリの動画数</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{totalVideoCount}</p>
                <p className="text-xs text-slate-500">平均 {categories.length > 0 ? (totalVideoCount / categories.length).toFixed(1) : 0}本/カテゴリ</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                <AlertTriangleIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">動画が未登録のカテゴリ</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{categories.filter(c => !videoCounts.get(c.id)).length}</p>
                <p className="text-xs text-slate-500">{categories.length}カテゴリ中</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="mb-6 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="py-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card className="mb-6">
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <FolderIcon className="w-5 h-5 text-da-gray-600" />
              <span className="font-medium text-slate-900 dark:text-white">新しいカテゴリ</span>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="name"
                  label="カテゴリ名"
                  placeholder="例: セキュリティ研修"
                  required
                />
                <Input
                  name="display_order"
                  label="表示順"
                  type="number"
                  defaultValue={nextOrder}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" isLoading={creating}>
                  {creating ? "追加中..." : <><CheckIcon />追加</>}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  キャンセル
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Editing form */}
      {editingId !== null && (
        <Card className="mb-6">
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <FolderIcon className="w-5 h-5 text-da-gray-600" />
              <span className="font-medium text-slate-900 dark:text-white">カテゴリを編集</span>
            </div>
            {(() => {
              const cat = categories.find((c) => c.id === editingId);
              if (!cat) return null;
              return (
                <form onSubmit={(e) => handleUpdate(cat.id, e)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      name="name"
                      label="カテゴリ名"
                      required
                      defaultValue={cat.name}
                    />
                    <Input
                      name="display_order"
                      label="表示順"
                      type="number"
                      defaultValue={cat.display_order}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" isLoading={updating}>
                      {updating ? "保存中..." : <><CheckIcon />保存</>}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                      キャンセル
                    </Button>
                  </div>
                </form>
              );
            })()}
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {categories.map((cat) => (
          <Card
            key={cat.id}
            draggable
            onDragStart={(e) => { e.stopPropagation(); setDragId(cat.id); }}
            onDragEnd={() => { setDragId(null); setDragOverId(null); }}
            onDragOver={(e) => { e.preventDefault(); setDragOverId(cat.id); }}
            onDrop={(e) => { e.preventDefault(); handleDrop(cat.id); }}
            className={`${
              dragOverId === cat.id && dragId !== cat.id
                ? "ring-2 ring-da-blue-900"
                : dragId === cat.id
                  ? "opacity-50"
                  : ""
            }`}
          >
            <div className="flex items-center">
              {/* Drag handle - desktop */}
              <div className="hidden lg:flex flex-shrink-0 pl-3 text-slate-400 dark:text-slate-600 cursor-grab active:cursor-grabbing">
                <GripIcon />
              </div>

              {/* Up/down buttons - mobile */}
              <div className="flex lg:hidden flex-shrink-0 pl-2 flex-col gap-0.5">
                <button
                  onClick={() => moveCategory(cat.id, "up")}
                  disabled={categories.indexOf(cat) === 0}
                  className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30"
                >
                  <ChevronUpIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveCategory(cat.id, "down")}
                  disabled={categories.indexOf(cat) === categories.length - 1}
                  className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30"
                >
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Category info */}
              <div className="flex-1 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 min-w-0">
                <FolderIcon className="w-5 h-5 text-da-gray-600 hidden sm:block flex-shrink-0" />
                <span className="font-medium text-slate-900 dark:text-white truncate">{cat.name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex-shrink-0">{videoCounts.get(cat.id) || 0}本</span>
                <span className="text-sm text-slate-500 font-mono flex-shrink-0">#{cat.display_order}</span>
              </div>

              {/* Actions - desktop */}
              <div className="hidden sm:flex gap-1 pr-4">
                <button
                  onClick={() => {
                    setEditingId(cat.id);
                    setShowForm(false);
                  }}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  title="編集"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => setDeleteTargetId(cat.id)}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-da-error dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
                  title="削除"
                >
                  <TrashIcon />
                </button>
              </div>
              {/* ... menu - mobile */}
              <div className="relative sm:hidden pr-2">
                <button
                  onClick={() => setMenuId(menuId === cat.id ? null : cat.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  <MoreVerticalIcon className="w-5 h-5" />
                </button>
                {menuId === cat.id && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                    <button
                      onClick={() => { setEditingId(cat.id); setShowForm(false); setMenuId(null); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <PencilIcon />
                      編集
                    </button>
                    <button
                      onClick={() => { setDeleteTargetId(cat.id); setMenuId(null); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <TrashIcon />
                      削除
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {categories.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              カテゴリがまだ登録されていません。「カテゴリを追加」ボタンから追加してください。
            </CardContent>
          </Card>
        )}
      </div>
      <ConfirmModal
        open={deleteTargetId !== null}
        title="カテゴリを削除"
        message="このカテゴリを削除してもよろしいですか？"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
        isLoading={deleting}
      />
    </div>
  );
}
