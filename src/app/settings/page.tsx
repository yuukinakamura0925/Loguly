"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getProfileById } from "@/lib/db";
import { updateDisplayName, updatePassword, updateEmail, uploadAvatar, deleteAccount } from "./actions";
import { ArrowLeftIcon } from "@/components/icons";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<{ display_name: string; email: string; role: string; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Messages
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [emailMessage, setEmailMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await getProfileById(supabase, user.id);
      if (data) {
        setProfile({
          display_name: data.display_name || "",
          email: data.email || "",
          role: data.role || "member",
          avatar_url: data.avatar_url || null,
        });
        setDisplayName(data.display_name || "");
      }
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  async function handleUpdateDisplayName(e: React.FormEvent) {
    e.preventDefault();
    setProfileMessage(null);

    const formData = new FormData();
    formData.set("displayName", displayName);

    const result = await updateDisplayName(formData);
    if (result.error) {
      setProfileMessage({ type: "error", text: result.error });
    } else {
      setProfileMessage({ type: "success", text: "表示名を更新しました" });
      setProfile((prev) => prev ? { ...prev, display_name: displayName } : null);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setProfileMessage(null);

    const formData = new FormData();
    formData.set("avatar", file);

    const result = await uploadAvatar(formData);
    if (result.error) {
      setProfileMessage({ type: "error", text: result.error });
    } else if (result.avatarUrl) {
      setProfile((prev) => prev ? { ...prev, avatar_url: result.avatarUrl! } : null);
      setProfileMessage({ type: "success", text: "プロフィール画像を更新しました" });
    }
    setAvatarUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);

    const formData = new FormData();
    formData.set("currentPassword", currentPassword);
    formData.set("newPassword", newPassword);
    formData.set("confirmPassword", confirmPassword);

    const result = await updatePassword(formData);
    if (result.error) {
      setPasswordMessage({ type: "error", text: result.error });
    } else {
      setPasswordMessage({ type: "success", text: "パスワードを更新しました" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailMessage(null);

    const formData = new FormData();
    formData.set("newEmail", newEmail);
    formData.set("password", emailPassword);

    const result = await updateEmail(formData);
    if (result.error) {
      setEmailMessage({ type: "error", text: result.error });
    } else {
      setEmailMessage({ type: "success", text: result.message || "メールアドレスを更新しました" });
      setNewEmail("");
      setEmailPassword("");
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleteMessage(null);

    const formData = new FormData();
    formData.set("password", deletePassword);
    formData.set("confirmation", deleteConfirmation);

    const result = await deleteAccount(formData);
    if (result.error) {
      setDeleteMessage({ type: "error", text: result.error });
    } else if (result.redirect) {
      router.push(result.redirect);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link
            href={
              profile?.role === "platform_admin"
                ? "/admin"
                : profile?.role === "org_admin"
                  ? "/org/members"
                  : "/dashboard"
            }
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm transition-colors"
          >
            <ArrowLeftIcon />
            戻る
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">アカウント設定</h1>

        {/* プロフィール */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">プロフィール</h2>

          {/* アバター */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt="プロフィール画像"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-500 flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.display_name?.charAt(0) || "?"}
                </div>
              )}
              {avatarUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                画像を変更
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <p className="text-xs text-slate-500 mt-1">JPG, PNG（2MB以下）</p>
            </div>
          </div>

          <form onSubmit={handleUpdateDisplayName} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-da-gray-600 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400"
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
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-da-gray-600 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            {profileMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                profileMessage.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-da-success dark:text-emerald-400"
                  : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              }`}>
                {profileMessage.text}
              </div>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-da-blue-900 text-white rounded-lg hover:bg-da-blue-1000 hover:underline transition-colors"
            >
              更新
            </button>
          </form>
        </section>

        {/* パスワード変更 */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">パスワード変更</h2>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                現在のパスワード
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-da-gray-600 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                新しいパスワード
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-da-gray-600 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
              />
              <p className="text-xs text-slate-500 mt-1">8文字以上</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                新しいパスワード（確認）
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-da-gray-600 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            {passwordMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                passwordMessage.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-da-success dark:text-emerald-400"
                  : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              }`}>
                {passwordMessage.text}
              </div>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-da-blue-900 text-white rounded-lg hover:bg-da-blue-1000 hover:underline transition-colors"
            >
              パスワードを変更
            </button>
          </form>
        </section>

        {/* メールアドレス変更 */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">メールアドレス変更</h2>
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                新しいメールアドレス
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-da-gray-600 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                パスワード（確認用）
              </label>
              <input
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-da-gray-600 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            {emailMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                emailMessage.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-da-success dark:text-emerald-400"
                  : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              }`}>
                {emailMessage.text}
              </div>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-da-blue-900 text-white rounded-lg hover:bg-da-blue-1000 hover:underline transition-colors"
            >
              メールアドレスを変更
            </button>
          </form>
        </section>

        {/* アカウント削除（プラットフォーム管理者以外のみ） */}
        {profile?.role !== "platform_admin" && (
          <section className="bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-900 p-6">
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">アカウント削除</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              アカウントを削除すると、全てのデータが削除され、復元できません。
            </p>
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  パスワード
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-da-gray-600 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  確認のため「削除する」と入力
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="削除する"
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-da-gray-600 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              {deleteMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  deleteMessage.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-da-success dark:text-emerald-400"
                    : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                }`}>
                  {deleteMessage.text}
                </div>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                アカウントを削除
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
