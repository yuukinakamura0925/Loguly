"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import InviteForm from "./invite-form";
import { removeMember, cancelInvitation } from "./actions";

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

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!membership) return;

    const [{ data: mems }, { data: invs }] = await Promise.all([
      supabase
        .from("organization_members")
        .select("user_id, role, joined_at, profiles(display_name, email)")
        .eq("organization_id", membership.organization_id)
        .order("joined_at"),
      supabase
        .from("invitations")
        .select("id, email, role, expires_at")
        .eq("organization_id", membership.organization_id)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }),
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
        <h1 className="text-2xl font-bold text-white">メンバー管理</h1>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          {showInvite ? "キャンセル" : "メンバーを招待"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
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

      {/* メンバー一覧 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-700">
          <h2 className="text-sm font-medium text-gray-400">
            メンバー ({members.length})
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                名前
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                メール
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                ロール
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                参加日
              </th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr
                key={m.user_id}
                className="border-b border-gray-700 last:border-b-0"
              >
                <td className="px-4 py-3 text-white">
                  {(m.profiles as unknown as { display_name: string })
                    ?.display_name}
                </td>
                <td className="px-4 py-3 text-gray-400 text-sm">
                  {(m.profiles as unknown as { email: string })?.email}
                </td>
                <td className="px-4 py-3">
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
                <td className="px-4 py-3 text-gray-400 text-sm">
                  {new Date(m.joined_at).toLocaleDateString("ja-JP")}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleRemove(m.user_id)}
                    className="text-red-400 hover:text-red-300 text-sm"
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
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700">
            <h2 className="text-sm font-medium text-gray-400">
              保留中の招待 ({invites.length})
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                  メール
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                  ロール
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                  有効期限
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-gray-700 last:border-b-0"
                >
                  <td className="px-4 py-3 text-white text-sm">{inv.email}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {inv.role === "org_admin" ? "管理者" : "メンバー"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {new Date(inv.expires_at).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleCancelInvite(inv.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
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
