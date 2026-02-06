"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
      className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
    >
      ログアウト
    </button>
  );
}
