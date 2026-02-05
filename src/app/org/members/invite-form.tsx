"use client";

import { useState } from "react";
import { createInvitation } from "./actions";

export default function InviteForm({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");

  async function handleSubmit(formData: FormData) {
    setError("");
    setInviteUrl("");
    const result = await createInvitation(formData);
    if (result.error) {
      setError(result.error);
    } else if (result.inviteUrl) {
      setInviteUrl(result.inviteUrl);
    }
  }

  if (inviteUrl) {
    return (
      <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-3">
        <div className="text-green-400 text-sm font-medium">
          招待を作成しました
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            招待リンク（メールで送信してください）
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={inviteUrl}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm font-mono"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={() => navigator.clipboard.writeText(inviteUrl)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              コピー
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-sm"
        >
          閉じる
        </button>
      </div>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            メールアドレス
          </label>
          <input
            name="email"
            type="email"
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
            placeholder="user@example.com"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">ロール</label>
          <select
            name="role"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
          >
            <option value="member">メンバー</option>
            <option value="org_admin">組織管理者</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
        >
          招待を送信
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 text-sm"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
