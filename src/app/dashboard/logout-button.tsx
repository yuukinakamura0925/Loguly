"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOutIcon } from "@/components/icons";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 active:bg-slate-300 dark:active:bg-slate-700 active:scale-[0.96] rounded-lg transition-all"
    >
      <LogOutIcon className="w-4 h-4" strokeWidth={1.5} />
      ログアウト
    </button>
  );
}
