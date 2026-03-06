"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Card, CardContent } from "@/components/ui";
import { Logo } from "@/components/logo";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password/update`,
    });

    if (error) {
      setError("リセットメールの送信に失敗しました。もう一度お試しください。");
      setIsLoading(false);
      return;
    }

    setSent(true);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-da-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" showText={false} />
          <h1 className="text-3xl font-bold text-white tracking-tight mt-4">Loguly</h1>
          <p className="text-slate-400 mt-2">パスワードリセット</p>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-8">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-da-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-da-blue-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-white">メールを送信しました</h2>
                <p className="text-sm text-slate-400">
                  <span className="text-white font-medium">{email}</span> にパスワードリセット用のリンクを送信しました。メールをご確認ください。
                </p>
                <p className="text-xs text-slate-500">
                  メールが届かない場合は迷惑メールフォルダをご確認ください。
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-sm text-slate-400 mb-2">
                  登録済みのメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
                </p>

                <Input
                  id="email"
                  type="email"
                  label="メールアドレス"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
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
                  リセットリンクを送信
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
