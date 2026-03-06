"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getMembershipByUserId, listOrgMembersWithJoinDate, listPendingInvitations } from "@/lib/db";
import InviteForm from "./invite-form";
import { removeMember, cancelInvitation } from "./actions";
import { ChevronRightIcon, SortIcon, SortAscIcon, SortDescIcon, SearchIcon } from "@/components/icons";

type Member = {
  user_id: string;
  role: string;
  joined_at: string;
  profiles: { display_name: string; email: string; avatar_url?: string | null };
};

type PendingInvite = {
  id: string;
  email: string;
  role: string;
  expires_at: string;
};

type SortKey = "display_name" | "role" | "joined_at";
type SortOrder = "asc" | "desc";

function SortButton({
  label,
  sortKey,
  currentSort,
  currentOrder,
  onSort,
  className = "",
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentOrder: SortOrder;
  onSort: (key: SortKey, order: SortOrder) => void;
  className?: string;
}) {
  const isActive = currentSort === sortKey;
  const nextOrder: SortOrder = isActive && currentOrder === "asc" ? "desc" : "asc";

  return (
    <th className={`text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey, nextOrder)}
        className={`inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors ${isActive ? "text-slate-900 dark:text-white" : ""}`}
      >
        {label}
        {isActive
          ? currentOrder === "asc"
            ? <SortAscIcon className="w-3 h-3 text-da-blue-900 dark:text-da-blue-300" />
            : <SortDescIcon className="w-3 h-3 text-da-blue-900 dark:text-da-blue-300" />
          : <SortIcon className="w-3 h-3 text-slate-400" />
        }
      </button>
    </th>
  );
}

export default function MembersPage() {
  const supabase = createClient();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("joined_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  useEffect(() => {
    let active = true;
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await getMembershipByUserId(supabase, user.id);
      if (!membership) return;

      const [membersResult, { data: invs }] = await Promise.all([
        listOrgMembersWithJoinDate(supabase, membership.organization_id),
        listPendingInvitations(supabase, membership.organization_id),
      ]);

      let mems = membersResult.data;
      if (membersResult.error) {
        // avatar_url カラムが未追加の場合のフォールバック
        const fallback = await supabase
          .from("organization_members")
          .select("user_id, role, joined_at, profiles(display_name, email)")
          .eq("organization_id", membership.organization_id)
          .order("joined_at");
        mems = fallback.data as typeof mems;
      }

      if (active) {
        setMembers((mems as unknown as Member[]) || []);
        setInvites((invs as PendingInvite[]) || []);
      }
    }
    fetchData();
    return () => { active = false; };
  }, [supabase, refreshKey]);

  function reload() {
    setRefreshKey((k) => k + 1);
  }

  function handleSort(key: SortKey, order: SortOrder) {
    setSortKey(key);
    setSortOrder(order);
  }

  async function handleRemove(userId: string) {
    setError("");
    const result = await removeMember(userId);
    if (result.error) {
      setError(result.error);
    } else {
      reload();
    }
  }

  async function handleCancelInvite(id: string) {
    setError("");
    const result = await cancelInvitation(id);
    if (result.error) {
      setError(result.error);
    } else {
      reload();
    }
  }

  const filteredAndSorted = useMemo(() => {
    let result = members;

    // Filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((m) => {
        const profile = m.profiles as unknown as { display_name: string; email: string };
        return (
          profile?.display_name?.toLowerCase().includes(q) ||
          profile?.email?.toLowerCase().includes(q)
        );
      });
    }

    // Sort
    return [...result].sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1;
      switch (sortKey) {
        case "display_name": {
          const aName = (a.profiles as unknown as { display_name: string })?.display_name || "";
          const bName = (b.profiles as unknown as { display_name: string })?.display_name || "";
          return dir * aName.localeCompare(bName, "ja");
        }
        case "role":
          return dir * a.role.localeCompare(b.role);
        case "joined_at":
          return dir * (new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime());
        default:
          return 0;
      }
    });
  }, [members, search, sortKey, sortOrder]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">メンバー管理</h1>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="px-4 py-2 bg-da-blue-900 text-white rounded-lg hover:bg-da-blue-1000 hover:underline transition-colors text-sm"
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
            reload();
          }}
        />
      )}

      {/* 検索 */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="名前・メールで検索..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 transition-all"
          />
        </div>
      </div>

      {/* メンバー一覧 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-medium text-slate-600 dark:text-slate-400">
            メンバー ({filteredAndSorted.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-transparent">
              <SortButton label="名前" sortKey="display_name" currentSort={sortKey} currentOrder={sortOrder} onSort={handleSort} />
              <th className="hidden sm:table-cell text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                メール
              </th>
              <SortButton label="ロール" sortKey="role" currentSort={sortKey} currentOrder={sortOrder} onSort={handleSort} />
              <SortButton label="参加日" sortKey="joined_at" currentSort={sortKey} currentOrder={sortOrder} onSort={handleSort} className="hidden md:table-cell" />
              <th className="text-right px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((m) => (
              <tr
                key={m.user_id}
                className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <td className="px-4 py-3">
                  {(() => {
                    const profile = m.profiles as unknown as { display_name: string; avatar_url?: string | null };
                    const avatar = profile?.avatar_url ? (
                      <Image src={profile.avatar_url} alt="" width={28} height={28} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                        m.role === "org_admin" ? "bg-da-blue-900" : "bg-slate-500 dark:bg-slate-600"
                      }`}>
                        {profile?.display_name?.charAt(0) || "?"}
                      </div>
                    );
                    return m.role === "org_admin" ? (
                      <span className="flex items-center gap-2 text-slate-900 dark:text-white">
                        {avatar}
                        {profile?.display_name}
                      </span>
                    ) : (
                      <Link
                        href={`/org/progress/${m.user_id}`}
                        className="flex items-center gap-2 text-slate-900 dark:text-white hover:text-da-blue-900 dark:hover:text-da-blue-300 hover:underline"
                      >
                        {avatar}
                        {profile?.display_name}
                        <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                      </Link>
                    );
                  })()}
                </td>
                <td className="hidden sm:table-cell px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
                  {(m.profiles as unknown as { email: string })?.email}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      m.role === "org_admin"
                        ? "bg-da-blue-50 dark:bg-da-blue-900/30 text-da-blue-900 dark:text-da-blue-300"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {m.role === "org_admin" ? "管理者" : "メンバー"}
                  </span>
                </td>
                <td className="hidden md:table-cell px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
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
      </div>

      {/* 保留中の招待 */}
      {invites.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-medium text-slate-600 dark:text-slate-400">
              保留中の招待 ({invites.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-transparent">
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  メール
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  ロール
                </th>
                <th className="hidden sm:table-cell text-left px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">
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
                  <td className="hidden sm:table-cell px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
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
        </div>
      )}
    </div>
  );
}
