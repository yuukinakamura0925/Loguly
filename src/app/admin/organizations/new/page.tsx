"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createOrganization } from "../actions";

export default function NewOrganizationPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  function toSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function handleSubmit(formData: FormData) {
    setError("");
    const result = await createOrganization(formData);
    if (result.error) {
      setError(result.error);
    } else {
      router.push("/admin/organizations");
    }
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
        <h1 className="text-2xl font-bold text-white mt-2">組織を作成</h1>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            組織名
          </label>
          <input
            name="name"
            required
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="株式会社○○"
            onChange={(e) => {
              const slugInput = document.querySelector<HTMLInputElement>(
                'input[name="slug"]'
              );
              if (slugInput) {
                slugInput.value = toSlug(e.target.value);
              }
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            スラッグ（URL識別子）
          </label>
          <input
            name="slug"
            required
            pattern="[a-z0-9-]+"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="example-corp"
          />
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
          作成
        </button>
      </form>
    </div>
  );
}
