"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { listCategories } from "@/lib/db";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "./actions";
import {
  Button,
  Input,
  Card,
  CardContent,
  PageHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  IconButton,
} from "@/components/ui";
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XIcon } from "@/components/icons";

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

  const load = useCallback(async () => {
    const { data } = await listCategories(supabase);
    setCategories((data as Category[]) || []);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(formData: FormData) {
    setError("");
    const result = await createCategory(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setShowForm(false);
      load();
    }
  }

  async function handleUpdate(id: number, formData: FormData) {
    setError("");
    const result = await updateCategory(id, formData);
    if (result.error) {
      setError(result.error);
    } else {
      setEditingId(null);
      load();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("このカテゴリを削除してもよろしいですか？")) return;
    setError("");
    const result = await deleteCategory(id);
    if (result.error) {
      setError(result.error);
    } else {
      load();
    }
  }

  return (
    <div>
      <PageHeader
        title="カテゴリ管理"
        description="動画のカテゴリを管理します"
        action={
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "primary"}>
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
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/20 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {showForm && (
        <Card className="mb-6">
          <CardContent>
            <form action={handleCreate} className="flex gap-4 items-end">
              <div className="flex-1">
                <Input
                  name="name"
                  label="カテゴリ名"
                  placeholder="例: セキュリティ研修"
                  required
                />
              </div>
              <div className="w-32">
                <Input
                  name="display_order"
                  label="表示順"
                  type="number"
                  defaultValue={0}
                />
              </div>
              <Button type="submit" className="mb-0.5">
                <CheckIcon />
                追加
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">表示順</TableHead>
            <TableHead>カテゴリ名</TableHead>
            <TableHead className="w-32 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((cat) => (
            <TableRow key={cat.id}>
              {editingId === cat.id ? (
                <TableCell colSpan={3} className="py-3">
                  <form
                    action={(formData) => handleUpdate(cat.id, formData)}
                    className="flex gap-4 items-center"
                  >
                    <input
                      name="display_order"
                      type="number"
                      defaultValue={cat.display_order}
                      className="w-24 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <input
                      name="name"
                      required
                      defaultValue={cat.name}
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">
                        <CheckIcon />
                        保存
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        <XIcon />
                        キャンセル
                      </Button>
                    </div>
                  </form>
                </TableCell>
              ) : (
                <>
                  <TableCell className="text-slate-500 font-mono">
                    {cat.display_order}
                  </TableCell>
                  <TableCell className="text-slate-900 dark:text-white font-medium">
                    {cat.name}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <IconButton
                        icon={<PencilIcon />}
                        label="編集"
                        onClick={() => setEditingId(cat.id)}
                      />
                      <IconButton
                        icon={<TrashIcon />}
                        label="削除"
                        variant="danger"
                        onClick={() => handleDelete(cat.id)}
                      />
                    </div>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
          {categories.length === 0 && (
            <TableEmpty colSpan={3} message="カテゴリがまだ登録されていません" />
          )}
        </TableBody>
      </Table>
    </div>
  );
}
