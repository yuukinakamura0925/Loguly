"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getMembershipByUserId, listOrgMembersWithJoinDate, listPendingInvitations } from "@/lib/db";
import InviteForm from "./invite-form";
import { removeMember, cancelInvitation } from "./actions";
import { ChevronRightIcon } from "@/components/icons";

type Member = {
  user_id: string;
  role: string;
  joined_at: string;
  profiles: { display_name: string; email: string };
};

type PendingInvite = {
  id: string;
  email: string;
  role: string;
  expires_at: string;
};

export default function MembersPage() {
  const supabase = createClient();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: membership } = await getMembershipByUserId(supabase, user.id);

    if (!membership) return;

    const [{ data: mems }, { data: invs }] = await Promise.all([
      listOrgMembersWithJoinDate(supabase, membership.organization_id),
      listPendingInvitations(supabase, membership.organization_id),
    ]);

    setMembers((mems as unknown as Member[]) || []);
    setInvites((invs as PendingInvite[]) || []);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRemove(userId: string) {
    setError("");
    const result = await removeMember(userId);
    if (result.error) {
      setError(result.error);
    } else {
      load();
    }
  }

  async function handleCancelInvite(id: string) {
    setError("");
    const result = await cancelInvitation(id);
    if (result.error) {
      setError(result.error);
    } else {
      load();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">メンバー管理</h1>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          {showInvite ? "キャンセル" : "メンバーを招待"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {showInvite && (
        <InviteForm
          onClose={() => {
            setShowInvite(false);
            load();
          }}
        />
      )}

      {/* 検索 */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="名前・メールで検索..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* メンバー一覧 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-medium text-slate-600 dark:text-slate-400">
            メンバー ({members.filter((m) => {
              if (!search) return true;
              const profile = m.profiles as unknown as { display_name: string; email: string };
              const q = search.toLowerCase();
              return (
                profile?.display_name?.toLowerCase().includes(q) ||
                profile?.email?.toLowerCase().includes(q)
              );
            }).length})
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-transparent">
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                名前
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                メール
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                ロール
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                参加日
              </th>
              <th className="text-right px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {members.filter((m) => {
              if (!search) return true;
              const profile = m.profiles as unknown as { display_name: string; email: string };
              const q = search.toLowerCase();
              return (
                profile?.display_name?.toLowerCase().includes(q) ||
                profile?.email?.toLowerCase().includes(q)
              );
            }).map((m) => (
              <tr
                key={m.user_id}
                className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/org/progress/${m.user_id}`}
                    className="flex items-center gap-2 text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {(m.profiles as unknown as { display_name: string })?.display_name}
                    <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
                  {(m.profiles as unknown as { email: string })?.email}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      m.role === "org_admin"
                        ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {m.role === "org_admin" ? "管理者" : "メンバー"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
                  {new Date(m.joined_at).toLocaleDateString("ja-JP")}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleRemove(m.user_id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 保留中の招待 */}
      {invites.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-medium text-slate-600 dark:text-slate-400">
              保留中の招待 ({invites.length})
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-transparent">
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  メール
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  ロール
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  有効期限
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                >
                  <td className="px-4 py-3 text-slate-900 dark:text-white text-sm">{inv.email}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
                    {inv.role === "org_admin" ? "管理者" : "メンバー"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
                    {new Date(inv.expires_at).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleCancelInvite(inv.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                    >
                      取消
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
