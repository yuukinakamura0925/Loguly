"use client";

import { useState } from "react";
import { createInvitation } from "./actions";

export default function InviteForm({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3 relative">
        {/* コピー完了トースト */}
        {copied && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm rounded-lg shadow-lg animate-fade-in">
            コピーしました
          </div>
        )}
        <div className="text-slate-900 dark:text-white text-sm font-medium">
          招待リンクを発行しました
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          以下のリンクをコピーして、Slackやメールなどで対象者に共有してください。リンクの有効期限は7日間です。
        </p>
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
            招待リンク
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={inviteUrl}
              className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm font-mono"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={handleCopy}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                copied
                  ? "bg-da-blue-1200 text-white"
                  : "bg-da-blue-900 text-white hover:bg-da-blue-1000 hover:underline"
              }`}
            >
              {copied ? "✓" : "コピー"}
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm"
        >
          閉じる
        </button>
      </div>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
            メールアドレス
          </label>
          <input
            name="email"
            type="email"
            required
            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm"
            placeholder="user@example.com"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">ロール</label>
          <select
            name="role"
            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm"
          >
            <option value="member">メンバー</option>
            <option value="org_admin">組織管理者</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-da-blue-900 text-white rounded-lg hover:bg-da-blue-1000 hover:underline text-sm"
        >
          招待リンクを発行
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 text-sm"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
