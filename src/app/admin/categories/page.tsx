"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "./actions";

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
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("display_order");
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">カテゴリ管理</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          {showForm ? "キャンセル" : "カテゴリを追加"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {showForm && (
        <form
          action={handleCreate}
          className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700 flex gap-3 items-end"
        >
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">
              カテゴリ名
            </label>
            <input
              name="name"
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
            />
          </div>
          <div className="w-24">
            <label className="block text-sm text-gray-400 mb-1">表示順</label>
            <input
              name="display_order"
              type="number"
              defaultValue={0}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            追加
          </button>
        </form>
      )}

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                表示順
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                カテゴリ名
              </th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr
                key={cat.id}
                className="border-b border-gray-700 last:border-b-0"
              >
                {editingId === cat.id ? (
                  <td colSpan={3} className="px-4 py-3">
                    <form
                      action={(formData) => handleUpdate(cat.id, formData)}
                      className="flex gap-3 items-end"
                    >
                      <div className="w-24">
                        <input
                          name="display_order"
                          type="number"
                          defaultValue={cat.display_order}
                          className="w-full px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          name="name"
                          required
                          defaultValue={cat.name}
                          className="w-full px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        className="text-green-400 hover:text-green-300 text-sm"
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-gray-400 hover:text-gray-300 text-sm"
                      >
                        キャンセル
                      </button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-3 text-gray-400 w-20">
                      {cat.display_order}
                    </td>
                    <td className="px-4 py-3 text-white">{cat.name}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditingId(cat.id)}
                        className="text-blue-400 hover:text-blue-300 text-sm mr-3"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        削除
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  カテゴリがまだ登録されていません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
