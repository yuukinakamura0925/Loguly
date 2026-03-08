"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMembershipByUserId, getOrganizationById, listActiveLicensesForOrg } from "@/lib/db";
import { updateOrgSettings } from "./actions";
import { Button } from "@/components/ui";
import { ChevronDownIcon } from "@/components/icons";

type License = {
  expires_at: string | null;
  videos: {
    title: string;
    display_order: number;
    categories: { name: string; display_order: number };
  };
};

type CategoryGroup = {
  name: string;
  display_order: number;
  videos: { title: string; expires_at: string | null }[];
};

export default function OrgSettingsPage() {
  const supabase = createClient();
  const [orgName, setOrgName] = useState("");
  const [slug, setSlug] = useState("");
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function fetchData() {
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

      if (!active) return;

      if (org) {
        setOrgName(org.name);
        setSlug(org.slug);
      }

      const licenses = (lics as unknown as License[]) || [];
      const categoryMap = new Map<string, CategoryGroup>();

      for (const lic of licenses) {
        const catName = lic.videos.categories.name;
        const catOrder = lic.videos.categories.display_order;

        if (!categoryMap.has(catName)) {
          categoryMap.set(catName, {
            name: catName,
            display_order: catOrder,
            videos: [],
          });
        }

        categoryMap.get(catName)!.videos.push({
          title: lic.videos.title,
          expires_at: lic.expires_at,
        });
      }

      const sorted = Array.from(categoryMap.values())
        .sort((a, b) => a.display_order - b.display_order)
        .map((cat) => ({
          ...cat,
          videos: cat.videos.sort((a, b) => a.title.localeCompare(b.title, "ja")),
        }));

      setCategories(sorted);
      setLoading(false);
    }
    fetchData();
    return () => { active = false; };
  }, [supabase, refreshKey]);

  function reload() {
    setRefreshKey((k) => k + 1);
  }

  function toggleCategory(name: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await updateOrgSettings(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        reload();
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-slate-600 dark:text-slate-400">読み込み中...</div>;
  }

  const totalVideos = categories.reduce((acc, cat) => acc + cat.videos.length, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">組織設定</h1>

      <div className="max-w-lg space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              組織名
            </label>
            <input
              name="name"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-da-gray-600 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              スラッグ
            </label>
            <input
              value={slug}
              disabled
              className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">
              スラッグは変更できません
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-800 rounded-lg">
              <p className="text-sm text-da-success dark:text-emerald-400">更新しました</p>
            </div>
          )}

          <Button type="submit" isLoading={saving}>
            更新
          </Button>
        </form>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
            利用可能な動画
            <span className="ml-2 text-sm font-normal text-slate-500">
              ({totalVideos}本)
            </span>
          </h2>

          {categories.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 text-center text-slate-500 text-sm">
              動画が割り当てられていません
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => {
                const isOpen = openCategories.has(category.name);
                return (
                  <div
                    key={category.name}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleCategory(category.name)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-da-blue-900" />
                        <span className="font-medium text-slate-900 dark:text-white">
                          {category.name}
                        </span>
                        <span className="text-sm text-slate-500">
                          ({category.videos.length}本)
                        </span>
                      </div>
                      <ChevronDownIcon
                        className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="border-t border-slate-200 dark:border-slate-700">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50">
                              <th className="text-left px-4 py-2 text-xs text-slate-500">
                                動画
                              </th>
                              <th className="text-left px-4 py-2 text-xs text-slate-500">
                                有効期限
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {category.videos.map((video, i) => (
                              <tr
                                key={i}
                                className="border-t border-slate-100 dark:border-slate-700/50"
                              >
                                <td className="px-4 py-2 text-slate-900 dark:text-white text-sm">
                                  {video.title}
                                </td>
                                <td className="px-4 py-2 text-slate-500 text-sm">
                                  {video.expires_at
                                    ? new Date(video.expires_at).toLocaleDateString("ja-JP")
                                    : "なし"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
