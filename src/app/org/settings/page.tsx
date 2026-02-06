"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMembershipByUserId, getOrganizationById, listActiveLicensesForOrg } from "@/lib/db";
import { updateOrgSettings } from "./actions";

export default function OrgSettingsPage() {
  const supabase = createClient();
  const [orgName, setOrgName] = useState("");
  const [slug, setSlug] = useState("");
  const [licenses, setLicenses] = useState<
    { videos: { title: string }; expires_at: string | null }[]
  >([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: membership } = await getMembershipByUserId(supabase, user.id);

    if (!membership) return;

    const [{ data: org }, { data: lics }] = await Promise.all([
      getOrganizationById(supabase, membership.organization_id),
      listActiveLicensesForOrg(supabase, membership.organization_id),
    ]);

    if (org) {
      setOrgName(org.name);
      setSlug(org.slug);
    }
    setLicenses((lics as unknown as typeof licenses) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(formData: FormData) {
    setError("");
    setSuccess(false);
    const result = await updateOrgSettings(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      load();
    }
  }

  if (loading) {
    return <div className="text-gray-400">読み込み中...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">組織設定</h1>

      <div className="max-w-lg space-y-6">
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              組織名
            </label>
            <input
              name="name"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              スラッグ
            </label>
            <input
              value={slug}
              disabled
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              スラッグは変更できません
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-900/30 border border-green-800 rounded-lg">
              <p className="text-sm text-green-400">更新しました</p>
            </div>
          )}

          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            更新
          </button>
        </form>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">
            利用可能なライセンス
          </h2>
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-4 py-2 text-sm text-gray-400">
                    動画
                  </th>
                  <th className="text-left px-4 py-2 text-sm text-gray-400">
                    有効期限
                  </th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((lic, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-700 last:border-b-0"
                  >
                    <td className="px-4 py-2 text-white text-sm">
                      {(lic.videos as unknown as { title: string })?.title}
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-sm">
                      {lic.expires_at
                        ? new Date(lic.expires_at).toLocaleDateString("ja-JP")
                        : "なし"}
                    </td>
                  </tr>
                ))}
                {licenses.length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-4 text-center text-gray-500 text-sm"
                    >
                      ライセンスが割り当てられていません
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
