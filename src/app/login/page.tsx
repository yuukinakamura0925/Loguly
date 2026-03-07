"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getProfileRole } from "@/lib/db";
import { Button, Input } from "@/components/ui";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  // パスワードリセットリンクからのリダイレクトを検知
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.push("/reset-password/update");
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth, router]);

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

    if (profile?.role === "platform_admin") {
      router.push("/admin");
    } else if (profile?.role === "org_admin") {
      router.push("/org/members");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* 左: ブランドパネル */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-emerald-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] bg-green-400/15 rounded-full blur-3xl" />

        <div className="relative z-10 text-center">
          <Logo size="lg" showText={false} />
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tighter mt-6">Loguly</h1>
          <p className="text-slate-500 mt-3 text-lg">動画研修管理</p>
        </div>

        <div className="relative z-10 mt-16 text-slate-400 text-sm">
          &copy; 2026 Prowing
        </div>
      </div>

      {/* 右: ログインフォーム（ライト） */}
      <div className="flex-1 flex items-center justify-center bg-white p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* モバイル用ロゴ */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <Logo size="lg" showText={false} />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tighter mt-4">Loguly</h1>
          </div>

          <div className="hidden lg:block mb-10">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">ログイン</h2>
            <p className="text-slate-500 mt-2">アカウントにサインインしてください</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="email"
              type="email"
              label="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
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
              ログイン
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/reset-password" className="text-sm text-slate-400 hover:text-da-blue-900 transition-colors">
              パスワードをお忘れですか？
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-200 flex items-center justify-between text-sm text-slate-400">
            <Link href="/" className="hover:text-slate-600 transition-colors">
              ← トップに戻る
            </Link>
            <div className="flex gap-3">
              <Link href="/terms" className="hover:text-slate-600 transition-colors">
                利用規約
              </Link>
              <Link href="/privacy" className="hover:text-slate-600 transition-colors">
                プライバシー
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
