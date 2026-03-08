"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getOrganizationById, listOrgMembers, listAllProfilesWithOrg } from "@/lib/db";
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
import { ArrowLeftIcon, TrashIcon, PlusIcon, UsersIcon } from "@/components/icons";

type Member = {
  id: string;
  user_id: string;
  role: string;
  profiles: { email: string; display_name: string };
};

type Profile = {
  id: string;
  email: string;
  display_name: string;
  role: string;
  organization_members: { organization_id: string; organizations: { name: string }[] }[];
};

export default function EditOrganizationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [maxOrgAdmins, setMaxOrgAdmins] = useState(1);
  const [members, setMembers] = useState<Member[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState("");
  const [memberError, setMemberError] = useState("");
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      const [{ data: org }, { data: mems }, { data: profiles }] = await Promise.all([
        getOrganizationById(supabase, id),
        listOrgMembers(supabase, id),
        listAllProfilesWithOrg(supabase),
      ]);
      if (active) {
        if (org) {
          setName(org.name);
          setIsActive(org.is_active);
          setMaxOrgAdmins(org.max_org_admins ?? 1);
        }
        setMembers((mems as unknown as Member[]) || []);
        setAllProfiles((profiles as Profile[]) || []);
        setLoading(false);
      }
    }
    fetchData();
    return () => { active = false; };
  }, [id, supabase, refreshKey]);

  // Split non-member profiles into truly unassigned vs. belonging to other orgs
  const { freeUsers, otherOrgUsers } = useMemo(() => {
    const memberIds = new Set(members.map((m) => m.user_id));
    const nonMembers = allProfiles.filter((p) => !memberIds.has(p.id));
    const free: Profile[] = [];
    const other: (Profile & { orgName: string })[] = [];
    for (const p of nonMembers) {
      const membership = p.organization_members?.[0];
      const orgName = membership?.organizations?.[0]?.name;
      if (orgName) {
        other.push({ ...p, orgName });
      } else {
        free.push(p);
      }
    }
    return { freeUsers: free, otherOrgUsers: other };
  }, [allProfiles, members]);

  function reload() {
    setRefreshKey((k) => k + 1);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUpdating(true);
    setError("");
    try {
      const formData = new FormData(e.currentTarget);
      const result = await updateOrganization(id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/admin/organizations");
      }
    } finally {
      setUpdating(false);
    }
  }

  async function handleAddMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAdding(true);
    setMemberError("");
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("organization_id", id);
      const result = await addOrgMember(formData);
      if (result.error) {
        setMemberError(result.error);
      } else {
        reload();
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveMember(userId: string) {
    setMemberError("");
    const result = await removeOrgMember(id, userId);
    if (result.error) {
      setMemberError(result.error);
    } else {
      reload();
    }
  }

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    setCreateSuccess("");
    try {
      const formData = new FormData(e.currentTarget);
      const result = await createOrgUser(id, formData);
      if (result.error) {
        setCreateError(result.error);
      } else {
        setCreateSuccess("ユーザーを作成しました");
        reload();
      }
    } finally {
      setCreating(false);
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
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm transition-colors"
        >
          <ArrowLeftIcon />
          組織一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-3">組織を編集</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 組織情報 */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">基本情報</h2>
          <Card>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  name="name"
                  label="組織名"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <Input
                  name="max_org_admins"
                  type="number"
                  label="管理者上限数"
                  min={1}
                  max={10}
                  required
                  value={maxOrgAdmins}
                  onChange={(e) => setMaxOrgAdmins(Number(e.target.value))}
                />

                <Switch
                  name="is_active"
                  checked={isActive}
                  onChange={setIsActive}
                  label="有効"
                />

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <div className="pt-2">
                  <Button type="submit" isLoading={updating}>
                    {updating ? "更新中..." : "更新"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* メンバー管理 */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">メンバー</h2>

          {/* ユーザー新規作成 */}
          <Card className="mb-4">
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
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
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
                    <p className="text-xs text-red-600 dark:text-red-400">{createError}</p>
                  </div>
                )}
                {createSuccess && (
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-800 rounded-lg">
                    <p className="text-xs text-da-success dark:text-emerald-400">{createSuccess}</p>
                  </div>
                )}

                <Button type="submit" size="sm" isLoading={creating}>
                  {creating ? "作成中..." : "ユーザーを作成"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 既存ユーザー追加 */}
          <Card className="mb-4">
            <CardContent>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <UsersIcon className="w-4 h-4" />
                  既存ユーザーを追加
                </div>

                {freeUsers.length === 0 && otherOrgUsers.length === 0 ? (
                  <p className="text-sm text-slate-500">追加可能なユーザーがいません</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Select name="email" label="ユーザー" required>
                        <option value="">選択してください</option>
                        {freeUsers.length > 0 && (
                          <optgroup label="未所属">
                            {freeUsers.map((u) => (
                              <option key={u.id} value={u.email}>
                                {u.display_name || u.email} ({u.email})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {otherOrgUsers.length > 0 && (
                          <optgroup label="他組織から移動">
                            {otherOrgUsers.map((u) => (
                              <option key={u.id} value={u.email}>
                                {u.display_name || u.email} ({u.email}) — {u.orgName}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </Select>
                      <Select name="role" label="ロール">
                        <option value="org_admin">組織管理者</option>
                        <option value="member">メンバー</option>
                      </Select>
                    </div>

                    {memberError && (
                      <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
                        <p className="text-xs text-red-600 dark:text-red-400">{memberError}</p>
                      </div>
                    )}

                    <Button type="submit" size="sm" variant="secondary" isLoading={adding}>
                      {adding ? "追加中..." : "追加"}
                    </Button>
                  </>
                )}
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
                    <div className="text-slate-900 dark:text-white text-sm font-medium">
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
                    {m.role !== "org_admin" && (
                      <button
                        onClick={() => handleRemoveMember(m.user_id)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-da-error dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
                        title="削除"
                      >
                        <TrashIcon />
                      </button>
                    )}
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
