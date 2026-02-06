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
import {
  Button,
  Input,
  Select,
  Switch,
  Card,
  CardContent,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui";
import { ArrowLeftIcon, TrashIcon, PlusIcon } from "@/components/icons";

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
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">読み込み中...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/organizations"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeftIcon />
          組織一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold text-white mt-3">組織を編集</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 組織情報 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">基本情報</h2>
          <Card>
            <CardContent>
              <form action={handleSubmit} className="space-y-4">
                <Input
                  name="name"
                  label="組織名"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <Input
                  name="slug"
                  label="スラッグ"
                  required
                  pattern="[a-z0-9-]+"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="font-mono"
                />

                <Switch
                  name="is_active"
                  checked={isActive}
                  onChange={setIsActive}
                  label="有効"
                />

                {error && (
                  <div className="p-3 bg-red-900/20 border border-red-800 rounded-xl">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <div className="pt-2">
                  <Button type="submit">更新</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* メンバー管理 */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">メンバー</h2>

          {/* ユーザー新規作成 */}
          <Card className="mb-4">
            <CardContent>
              <form action={handleCreateUser} className="space-y-4">
                <div className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <PlusIcon className="w-4 h-4" />
                  ユーザーを作成して追加
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    name="email"
                    type="email"
                    label="メールアドレス"
                    required
                    placeholder="user@example.com"
                  />
                  <Input
                    name="display_name"
                    label="表示名"
                    placeholder="山田 太郎"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    name="password"
                    type="password"
                    label="パスワード"
                    required
                    minLength={6}
                    placeholder="6文字以上"
                  />
                  <Select name="role" label="ロール">
                    <option value="org_admin">組織管理者</option>
                    <option value="member">メンバー</option>
                  </Select>
                </div>

                {createError && (
                  <div className="p-2 bg-red-900/20 border border-red-800 rounded-lg">
                    <p className="text-xs text-red-400">{createError}</p>
                  </div>
                )}
                {createSuccess && (
                  <div className="p-2 bg-green-900/20 border border-green-800 rounded-lg">
                    <p className="text-xs text-green-400">{createSuccess}</p>
                  </div>
                )}

                <Button type="submit" size="sm">ユーザーを作成</Button>
              </form>
            </CardContent>
          </Card>

          {/* 既存ユーザー追加 */}
          <Card className="mb-4">
            <CardContent>
              <form action={handleAddMember} className="space-y-4">
                <div className="text-sm font-medium text-slate-300">
                  既存ユーザーを追加
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    name="email"
                    type="email"
                    label="メールアドレス"
                    required
                    placeholder="user@example.com"
                  />
                  <Select name="role" label="ロール">
                    <option value="org_admin">組織管理者</option>
                    <option value="member">メンバー</option>
                  </Select>
                </div>

                {memberError && (
                  <div className="p-2 bg-red-900/20 border border-red-800 rounded-lg">
                    <p className="text-xs text-red-400">{memberError}</p>
                  </div>
                )}

                <Button type="submit" size="sm" variant="secondary">追加</Button>
              </form>
            </CardContent>
          </Card>

          {/* メンバー一覧 */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ユーザー</TableHead>
                <TableHead>ロール</TableHead>
                <TableHead className="text-right w-20">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="text-white text-sm font-medium">
                      {m.profiles?.display_name}
                    </div>
                    <div className="text-slate-500 text-xs">
                      {m.profiles?.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.role === "org_admin" ? "info" : "default"}>
                      {m.role === "org_admin" ? "管理者" : "メンバー"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => handleRemoveMember(m.user_id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="削除"
                    >
                      <TrashIcon />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {members.length === 0 && (
                <TableEmpty colSpan={3} message="メンバーがいません" />
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
