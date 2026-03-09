"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getProfileById } from "@/lib/db";
import { updateDisplayName, updatePassword, updateEmail, uploadAvatar, deleteAccount } from "./actions";
import { ArrowLeftIcon } from "@/components/icons";
import { Button, Input } from "@/components/ui";

function AvatarCropModal({
  file,
  onConfirm,
  onCancel,
}: {
  file: File;
  onConfirm: (file: File, crop: { left: number; top: number; size: number }) => void;
  onCancel: () => void;
}) {
  const CONTAINER = 280;
  const CIRCLE = 220;
  const circleOff = (CONTAINER - CIRCLE) / 2;

  const imageUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const [nat, setNat] = useState({ w: 0, h: 0 });
  const [pos, setPos] = useState({ ox: 0, oy: 0 });
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const scale = nat.w > 0 ? CIRCLE / Math.min(nat.w, nat.h) : 1;

  const clamp = (ox: number, oy: number) => ({
    ox: Math.min(circleOff, Math.max(circleOff + CIRCLE - nat.w * scale, ox)),
    oy: Math.min(circleOff, Math.max(circleOff + CIRCLE - nat.h * scale, oy)),
  });

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const w = e.currentTarget.naturalWidth;
    const h = e.currentTarget.naturalHeight;
    const sc = CIRCLE / Math.min(w, h);
    setNat({ w, h });
    setPos({
      ox: circleOff - (w * sc - CIRCLE) / 2,
      oy: circleOff - (h * sc - CIRCLE) / 2,
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.ox, oy: pos.oy };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setPos(clamp(d.ox + (e.clientX - d.sx), d.oy + (e.clientY - d.sy)));
  };

  const handlePointerUp = () => { dragRef.current = null; };

  const handleConfirm = () => {
    const cropLeft = Math.round((circleOff - pos.ox) / scale);
    const cropTop = Math.round((circleOff - pos.oy) / scale);
    const cropSize = Math.round(CIRCLE / scale);
    onConfirm(file, { left: cropLeft, top: cropTop, size: cropSize });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full shadow-xl overflow-hidden">
        <div className="p-4 pb-2 text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            画像の位置を調整
          </h3>
        </div>

        <div className="flex justify-center py-4 bg-slate-950">
          <div
            className="relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
            style={{ width: CONTAINER, height: CONTAINER, touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt=""
                onLoad={onImageLoad}
                draggable={false}
                className="absolute pointer-events-none"
                style={{
                  width: nat.w * scale,
                  height: nat.h * scale,
                  left: pos.ox,
                  top: pos.oy,
                }}
              />
            )}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${CONTAINER} ${CONTAINER}`}>
              <defs>
                <mask id="cropMask">
                  <rect width={CONTAINER} height={CONTAINER} fill="white" />
                  <circle cx={CONTAINER / 2} cy={CONTAINER / 2} r={CIRCLE / 2} fill="black" />
                </mask>
              </defs>
              <rect width={CONTAINER} height={CONTAINER} fill="rgba(0,0,0,0.55)" mask="url(#cropMask)" />
              <circle cx={CONTAINER / 2} cy={CONTAINER / 2} r={CIRCLE / 2} fill="none" stroke="white" strokeWidth="2" opacity="0.7" />
            </svg>
          </div>
        </div>

        <div className="px-4 pt-3 pb-4">
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onCancel} className="flex-1">
              キャンセル
            </Button>
            <Button onClick={handleConfirm} className="flex-1">
              決定
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<{ display_name: string; email: string; role: string; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
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

  // Loading states
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

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
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const formData = new FormData();
      formData.set("displayName", displayName);

      const result = await updateDisplayName(formData);
      if (result.error) {
        setProfileMessage({ type: "error", text: result.error });
      } else {
        setProfileMessage({ type: "success", text: "表示名を更新しました" });
        setProfile((prev) => prev ? { ...prev, display_name: displayName } : null);
      }
    } finally {
      setSavingProfile(false);
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
  }

  async function handleCropConfirm(file: File, crop: { left: number; top: number; size: number }) {
    setCropFile(null);
    setAvatarUploading(true);
    setProfileMessage(null);

    const formData = new FormData();
    formData.set("avatar", file);
    formData.set("cropLeft", String(crop.left));
    formData.set("cropTop", String(crop.top));
    formData.set("cropSize", String(crop.size));

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
    setSavingPassword(true);
    setPasswordMessage(null);
    try {
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
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault();
    setSavingEmail(true);
    setEmailMessage(null);
    try {
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
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeletingAccount(true);
    setDeleteMessage(null);
    try {
      const formData = new FormData();
      formData.set("password", deletePassword);
      formData.set("confirmation", deleteConfirmation);

      const result = await deleteAccount(formData);
      if (result.error) {
        setDeleteMessage({ type: "error", text: result.error });
      } else if (result.redirect) {
        router.push(result.redirect);
      }
    } finally {
      setDeletingAccount(false);
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
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white active:opacity-70 text-sm transition-all"
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

          {/* アバター（platform_admin以外） */}
          {profile?.role !== "platform_admin" && (
            <>
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
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    isLoading={avatarUploading}
                  >
                    画像を変更
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <p className="text-xs text-slate-500 mt-1">JPG, PNG（10MB以下）</p>
                </div>
              </div>

              {cropFile && (
                <AvatarCropModal
                  file={cropFile}
                  onConfirm={handleCropConfirm}
                  onCancel={() => {
                    setCropFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                />
              )}
            </>
          )}

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
            <Button type="submit" isLoading={savingProfile}>
              更新
            </Button>
          </form>
        </section>

        {/* パスワード変更 */}
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">パスワード変更</h2>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <Input
              type="password"
              label="現在のパスワード"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <div>
              <Input
                type="password"
                label="新しいパスワード"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">8文字以上</p>
            </div>
            <Input
              type="password"
              label="新しいパスワード（確認）"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {passwordMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                passwordMessage.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-da-success dark:text-emerald-400"
                  : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              }`}>
                {passwordMessage.text}
              </div>
            )}
            <Button type="submit" isLoading={savingPassword}>
              パスワードを変更
            </Button>
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
            <Input
              type="password"
              label="パスワード（確認用）"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
            />
            {emailMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                emailMessage.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-da-success dark:text-emerald-400"
                  : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              }`}>
                {emailMessage.text}
              </div>
            )}
            <Button type="submit" isLoading={savingEmail}>
              メールアドレスを変更
            </Button>
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
              <Input
                type="password"
                label="パスワード"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
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
              <Button type="submit" variant="danger" isLoading={deletingAccount}>
                アカウントを削除
              </Button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
