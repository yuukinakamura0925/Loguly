"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { listLicensesWithDetails, listOrganizationNames, listVideoNames } from "@/lib/db";
import { assignLicense, revokeLicense } from "./actions";

type License = {
  id: string;
  organization_id: string;
  video_id: number;
  expires_at: string | null;
  is_active: boolean;
  organizations: { name: string };
  videos: { title: string };
};

type Org = { id: string; name: string };
type Video = { id: number; title: string };

export default function LicensesPage() {
  const supabase = createClient();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [{ data: lics }, { data: os }, { data: vs }] = await Promise.all([
      listLicensesWithDetails(supabase),
      listOrganizationNames(supabase),
      listVideoNames(supabase),
    ]);
    setLicenses((lics as License[]) || []);
    setOrgs((os as Org[]) || []);
    setVideos((vs as Video[]) || []);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAssign(formData: FormData) {
    setError("");
    const result = await assignLicense(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setShowForm(false);
      load();
    }
  }

  async function handleRevoke(id: string) {
    setError("");
    const result = await revokeLicense(id);
    if (result.error) {
      setError(result.error);
    } else {
      load();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">ライセンス管理</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          {showForm ? "キャンセル" : "ライセンスを割当"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {showForm && (
        <form
          action={handleAssign}
          className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">組織</label>
              <select
                name="organization_id"
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              >
                <option value="">選択してください</option>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">動画</label>
              <select
                name="video_id"
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              >
                <option value="">選択してください</option>
                {videos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              有効期限（任意）
            </label>
            <input
              name="expires_at"
              type="date"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            割当
          </button>
        </form>
      )}

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                組織
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                動画
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                有効期限
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                ステータス
              </th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {licenses.map((lic) => (
              <tr
                key={lic.id}
                className="border-b border-gray-700 last:border-b-0"
              >
                <td className="px-4 py-3 text-white">
                  {lic.organizations?.name}
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {lic.videos?.title}
                </td>
                <td className="px-4 py-3 text-gray-400 text-sm">
                  {lic.expires_at
                    ? new Date(lic.expires_at).toLocaleDateString("ja-JP")
                    : "なし"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      lic.is_active
                        ? "bg-green-900 text-green-300"
                        : "bg-red-900 text-red-300"
                    }`}
                  >
                    {lic.is_active ? "有効" : "無効"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleRevoke(lic.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
            {licenses.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  ライセンスがまだ割り当てられていません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
