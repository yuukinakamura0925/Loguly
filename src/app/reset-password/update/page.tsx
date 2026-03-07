"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import { Logo } from "@/components/logo";
import { LoaderIcon } from "@/components/icons";

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
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" showText={false} />
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tighter mt-4">Loguly</h1>
          <p className="text-slate-500 mt-2">新しいパスワードを設定</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8">
            {checking ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <LoaderIcon className="animate-spin h-8 w-8 text-da-blue-900" />
                </div>
                <p className="text-sm text-slate-500">認証情報を確認中...</p>
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
                  <div className="p-4 bg-red-50 border border-da-error/20 rounded-xl">
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
        </div>

        <div className="text-center text-sm text-slate-400 mt-8">
          <Link href="/login" className="hover:text-slate-600 transition-colors">
            ← ログインに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
