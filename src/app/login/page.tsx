"use client";

import { useState } from "react";
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
    <div className="min-h-screen flex items-center justify-center bg-da-gray-900 p-4">

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" showText={false} />
          <h1 className="text-3xl font-bold text-white tracking-tight mt-4">Loguly</h1>
          <p className="text-slate-400 mt-2">ログイン</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
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
                <div className="p-4 bg-red-900/30 border border-da-error/20 rounded-xl">
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
              <Link href="/reset-password" className="text-sm text-slate-400 hover:text-da-blue-300 transition-colors">
                パスワードをお忘れですか？
              </Link>
            </div>
        </div>

        <div className="text-center text-sm text-slate-500 mt-8">
          <Link href="/" className="hover:text-slate-300 transition-colors">
            ← トップに戻る
          </Link>
        </div>

        <div className="text-center text-sm text-slate-500 mt-4 flex gap-3 justify-center">
          <Link href="/terms" className="hover:text-slate-300 transition-colors">
            利用規約
          </Link>
          <span className="text-slate-600">|</span>
          <Link href="/privacy" className="hover:text-slate-300 transition-colors">
            プライバシーポリシー
          </Link>
        </div>
      </div>
    </div>
  );
}
