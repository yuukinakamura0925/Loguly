"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOutIcon } from "@/components/icons";
import { Button } from "@/components/ui";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} isLoading={loggingOut}>
      <LogOutIcon className="w-4 h-4" strokeWidth={1.5} />
      ログアウト
    </Button>
  );
}
