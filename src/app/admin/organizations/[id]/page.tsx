"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { updateOrganization } from "../actions";

export default function EditOrganizationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setName(data.name);
        setSlug(data.slug);
        setIsActive(data.is_active);
      }
      setLoading(false);
    }
    load();
  }, [id, supabase]);

  async function handleSubmit(formData: FormData) {
    setError("");
    const result = await updateOrganization(id, formData);
    if (result.error) {
      setError(result.error);
    } else {
      router.push("/admin/organizations");
    }
  }

  if (loading) {
    return <div className="text-gray-400">読み込み中...</div>;
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link
          href="/admin/organizations"
          className="text-gray-400 hover:text-white text-sm"
        >
          &larr; 組織一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">組織を編集</h1>
      </div>

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
  );
}
