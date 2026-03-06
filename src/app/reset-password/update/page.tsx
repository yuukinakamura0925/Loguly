"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Card, CardContent } from "@/components/ui";
import { Logo } from "@/components/logo";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setReady(true);
      }
      setChecking(false);
    };
    checkSession();
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      return;
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません。");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("パスワードの更新に失敗しました。もう一度お試しください。");
      setIsLoading(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-da-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" showText={false} />
          <h1 className="text-3xl font-bold text-white tracking-tight mt-4">Loguly</h1>
          <p className="text-slate-400 mt-2">新しいパスワードを設定</p>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-8">
            {checking ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <svg className="animate-spin h-8 w-8 text-da-blue-300" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400">認証情報を確認中...</p>
              </div>
            ) : !ready ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-da-error">
                  リセットリンクが無効または期限切れです。もう一度パスワードリセットをお試しください。
                </p>
                <Link href="/reset-password">
                  <Button className="w-full" size="lg">
                    パスワードリセットへ
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  id="password"
                  type="password"
                  label="新しいパスワード"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8文字以上"
                  required
                />

                <Input
                  id="confirmPassword"
                  type="password"
                  label="パスワード（確認）"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="もう一度入力"
                  required
                />

                {error && (
                  <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-da-error/20 rounded-xl">
                    <p className="text-sm text-da-error">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full"
                  size="lg"
                >
                  パスワードを更新
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-slate-500 mt-8">
          <Link href="/login" className="hover:text-slate-300 transition-colors">
            ← ログインに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
