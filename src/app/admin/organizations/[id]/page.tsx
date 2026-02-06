"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getOrganizationById, listOrgMembers } from "@/lib/db";
import {
  updateOrganization,
  addOrgMember,
  removeOrgMember,
  createOrgUser,
} from "../actions";

type Member = {
  id: string;
  user_id: string;
  role: string;
  profiles: { email: string; display_name: string };
};

export default function EditOrganizationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState("");
  const [memberError, setMemberError] = useState("");
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [{ data: org }, { data: mems }] = await Promise.all([
      getOrganizationById(supabase, id),
      listOrgMembers(supabase, id),
    ]);

    if (org) {
      setName(org.name);
      setSlug(org.slug);
      setIsActive(org.is_active);
    }
    setMembers((mems as unknown as Member[]) || []);
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(formData: FormData) {
    setError("");
    const result = await updateOrganization(id, formData);
    if (result.error) {
      setError(result.error);
    } else {
      router.push("/admin/organizations");
    }
  }

  async function handleAddMember(formData: FormData) {
    setMemberError("");
    formData.set("organization_id", id);
    const result = await addOrgMember(formData);
    if (result.error) {
      setMemberError(result.error);
    } else {
      load();
    }
  }

  async function handleRemoveMember(userId: string) {
    setMemberError("");
    const result = await removeOrgMember(id, userId);
    if (result.error) {
      setMemberError(result.error);
    } else {
      load();
    }
  }

  async function handleCreateUser(formData: FormData) {
    setCreateError("");
    setCreateSuccess("");
    const result = await createOrgUser(id, formData);
    if (result.error) {
      setCreateError(result.error);
    } else {
      setCreateSuccess("ユーザーを作成しました");
      load();
    }
  }

  if (loading) {
    return <div className="text-gray-400">読み込み中...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/organizations"
          className="text-gray-400 hover:text-white text-sm"
        >
          &larr; 組織一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">組織を編集</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 組織情報 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">基本情報</h2>
          <form action={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                組織名
              </label>
              <input
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                スラッグ
              </label>
              <input
                name="slug"
                required
                pattern="[a-z0-9-]+"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="hidden"
                name="is_active"
                value={isActive ? "true" : "false"}
              />
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
              <span className="text-sm text-gray-300">有効</span>
            </div>

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              更新
            </button>
          </form>
        </div>

        {/* メンバー管理 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">メンバー</h2>

          {/* ユーザー新規作成 */}
          <form
            action={handleCreateUser}
            className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-3"
          >
            <div className="text-sm font-medium text-gray-300 mb-1">
              ユーザーを作成して追加
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  メールアドレス
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  表示名
                </label>
                <input
                  name="display_name"
                  placeholder="山田 太郎"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  パスワード
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="6文字以上"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  ロール
                </label>
                <select
                  name="role"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                >
                  <option value="org_admin">組織管理者</option>
                  <option value="member">メンバー</option>
                </select>
              </div>
            </div>

            {createError && (
              <div className="p-2 bg-red-900/30 border border-red-800 rounded-lg">
                <p className="text-xs text-red-400">{createError}</p>
              </div>
            )}
            {createSuccess && (
              <div className="p-2 bg-green-900/30 border border-green-800 rounded-lg">
                <p className="text-xs text-green-400">{createSuccess}</p>
              </div>
            )}

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              ユーザーを作成
            </button>
          </form>

          {/* 既存ユーザー追加 */}
          <form
            action={handleAddMember}
            className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-3"
          >
            <div className="text-sm font-medium text-gray-300 mb-1">
              既存ユーザーを追加
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  メールアドレス
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  ロール
                </label>
                <select
                  name="role"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                >
                  <option value="org_admin">組織管理者</option>
                  <option value="member">メンバー</option>
                </select>
              </div>
            </div>

            {memberError && (
              <div className="p-2 bg-red-900/30 border border-red-800 rounded-lg">
                <p className="text-xs text-red-400">{memberError}</p>
              </div>
            )}

            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              追加
            </button>
          </form>

          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-4 py-2 text-sm text-gray-400">
                    ユーザー
                  </th>
                  <th className="text-left px-4 py-2 text-sm text-gray-400">
                    ロール
                  </th>
                  <th className="text-right px-4 py-2 text-sm text-gray-400">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-gray-700 last:border-b-0"
                  >
                    <td className="px-4 py-2">
                      <div className="text-white text-sm">
                        {m.profiles?.display_name}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {m.profiles?.email}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          m.role === "org_admin"
                            ? "bg-purple-900 text-purple-300"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {m.role === "org_admin" ? "管理者" : "メンバー"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleRemoveMember(m.user_id)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-4 text-center text-gray-500 text-sm"
                    >
                      メンバーがいません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
