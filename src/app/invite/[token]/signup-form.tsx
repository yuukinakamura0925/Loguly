"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { acceptInvitation } from "./actions";
import { CheckIcon } from "@/components/icons";

export default function SignupForm({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const supabase = createClient();
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!agreedToTerms) {
      setError("利用規約とプライバシーポリシーに同意してください");
      return;
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }

    setIsLoading(true);

    // 1. ユーザー登録
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email,
        },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        setError(
          "このメールアドレスは既に登録されています。ログインページからログインしてください。"
        );
      } else {
        setError(signUpError.message);
      }
      setIsLoading(false);
      return;
    }

    // 2. 招待を受諾（組織メンバーに追加）
    const result = await acceptInvitation(token, email);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    // 成功
    setSuccess(true);
    setIsLoading(false);
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-da-blue-50 rounded-full flex items-center justify-center mx-auto">
          <CheckIcon className="w-8 h-8 text-da-blue-900" strokeWidth={2} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          登録完了
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          確認メールを送信しました。
          <br />
          メール内のリンクをクリックして
          <br />
          アカウントを有効化してください。
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-500">
          有効化後、ログインページからログインできます。
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          メールアドレス
        </label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full px-4 py-3 border border-da-gray-600 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          表示名
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className="w-full px-4 py-3 border border-da-gray-600 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
          placeholder="山田 太郎"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          パスワード
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-3 border border-da-gray-600 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
          placeholder="6文字以上"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          パスワード（確認）
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-3 border border-da-gray-600 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
        />
      </div>

      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="terms"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-da-gray-600"
        />
        <label htmlFor="terms" className="text-sm text-slate-400">
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-da-blue-300 hover:underline">利用規約</a>
          および
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-da-blue-300 hover:underline">プライバシーポリシー</a>
          に同意します
        </label>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-da-blue-900 hover:bg-da-blue-1000 disabled:bg-da-gray-300 disabled:text-da-gray-50 text-white hover:underline font-medium rounded-lg transition-colors"
      >
        {isLoading ? "登録中..." : "アカウントを作成して参加"}
      </button>
    </form>
  );
}
