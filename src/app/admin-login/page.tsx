"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getProfileRole } from "@/lib/db";
import { Button, Input, Card, CardContent } from "@/components/ui";
import { Logo } from "@/components/logo";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "メールアドレスまたはパスワードが正しくありません"
        : error.message);
      setIsLoading(false);
      return;
    }

    const { data: profile } = await getProfileRole(supabase, data.user.id);

    // 一般メンバーはメンバーログインページへ誘導
    if (profile?.role === "member") {
      await supabase.auth.signOut();
      setError("一般メンバーの方はメンバーログインページをご利用ください");
      setIsLoading(false);
      return;
    }

    if (profile?.role === "platform_admin") {
      router.push("/admin");
    } else if (profile?.role === "org_admin") {
      router.push("/org/members");
    } else {
      // Unknown role
      await supabase.auth.signOut();
      setError("アカウントの権限が不明です");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Admin Badge */}
        <div className="flex justify-center mb-6">
          <span className="px-4 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-medium">
            管理者専用
          </span>
        </div>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mt-4">Loguly Admin</h1>
          <p className="text-purple-300/70 mt-2">プラットフォーム・組織管理者</p>
        </div>

        {/* Login Card */}
        <Card className="bg-slate-900/70 backdrop-blur-xl border-purple-500/20">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="email"
                type="email"
                label="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />

              <Input
                id="password"
                type="password"
                label="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-500/25"
                size="lg"
              >
                管理者ログイン
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/reset-password" className="text-sm text-slate-400 hover:text-purple-400 transition-colors">
                パスワードをお忘れですか？
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-purple-300/50 mt-8 space-y-2">
          <p>
            <Link href="/login" className="hover:text-purple-300 transition-colors">
              メンバーログインはこちら
            </Link>
          </p>
          <p>
            <Link href="/" className="hover:text-purple-300 transition-colors">
              ← トップに戻る
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
