"use client";

import { useState } from "react";
import { createInvitation } from "./actions";
import { Button } from "@/components/ui";

export default function InviteForm({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setInviteUrl("");
    try {
      const formData = new FormData(e.currentTarget);
      const result = await createInvitation(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.inviteUrl) {
        setInviteUrl(result.inviteUrl);
      }
    } finally {
      setSubmitting(false);
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
          以下のリンクをコピーして、メールやチャットなどで対象者に共有してください。リンクの有効期限は7日間です。
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
            <Button onClick={handleCopy} size="sm">
              {copied ? "コピー済み" : "コピー"}
            </Button>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={onClose}>
          閉じる
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
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
        <Button type="submit" size="sm" isLoading={submitting}>
          招待リンクを発行
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
