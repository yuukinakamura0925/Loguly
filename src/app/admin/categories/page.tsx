"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { listCategories } from "@/lib/db";
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
} from "@/components/ui";
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XIcon, FolderIcon, GripIcon } from "@/components/icons";

type Category = {
  id: number;
  name: string;
  display_order: number;
};

export default function CategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // D&D state
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      const { data } = await listCategories(supabase);
      if (active) setCategories((data as Category[]) || []);
    }
    fetchData();
    return () => { active = false; };
  }, [supabase, refreshKey]);

  function reload() {
    setRefreshKey((k) => k + 1);
  }

  async function handleCreate(formData: FormData) {
    setError("");
    const result = await createCategory(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setShowForm(false);
      reload();
    }
  }

  async function handleUpdate(id: number, formData: FormData) {
    setError("");
    const result = await updateCategory(id, formData);
    if (result.error) {
      setError(result.error);
    } else {
      setEditingId(null);
      reload();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("このカテゴリを削除してもよろしいですか？")) return;
    setError("");
    const result = await deleteCategory(id);
    if (result.error) {
      setError(result.error);
    } else {
      reload();
    }
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
            <form action={handleCreate} className="space-y-4">
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
                <Button type="submit">
                  <CheckIcon />
                  追加
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
                <form action={(formData) => handleUpdate(cat.id, formData)} className="space-y-4">
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
                    <Button type="submit">
                      <CheckIcon />
                      保存
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
              {/* Drag handle */}
              <div className="flex-shrink-0 pl-3 text-slate-400 dark:text-slate-600 cursor-grab active:cursor-grabbing">
                <GripIcon />
              </div>

              {/* Category info */}
              <div className="flex-1 flex items-center gap-3 px-4 py-3">
                <FolderIcon className="w-5 h-5 text-da-gray-600" />
                <span className="font-medium text-slate-900 dark:text-white">{cat.name}</span>
                <span className="text-sm text-slate-500 font-mono">#{cat.display_order}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-1 pr-4">
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
                  onClick={() => handleDelete(cat.id)}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-da-error dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
                  title="削除"
                >
                  <TrashIcon />
                </button>
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
    </div>
  );
}
