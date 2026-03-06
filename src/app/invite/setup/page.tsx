"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function InviteSetupPage() {
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setChecking(false);
    };
    checkUser();
  }, [supabase.auth, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
      data: { display_name: displayName },
    });

    if (error) {
      setError("設定に失敗しました。もう一度お試しください。");
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-da-blue-900" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-slate-500 dark:text-slate-400">確認中...</span>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-da-blue-50 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-da-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">設定完了</h2>
            <p className="text-slate-600 dark:text-slate-400">
              アカウントの設定が完了しました。ログインしてご利用ください。
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full py-3 px-4 bg-da-blue-900 hover:bg-da-blue-1000 text-white hover:underline font-medium rounded-lg transition-colors"
            >
              ログインへ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Loguly</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">アカウント設定</p>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            表示名とパスワードを設定してください。
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              {isLoading ? "設定中..." : "設定を完了する"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
