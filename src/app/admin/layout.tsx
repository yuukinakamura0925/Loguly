import Link from "next/link";
import { requireRole } from "@/lib/auth";
import AdminSidebar from "@/components/admin-sidebar";
import LogoutButton from "@/app/dashboard/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SettingsIcon } from "@/components/icons";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("platform_admin");

  return (
    <div className="h-screen bg-slate-100 dark:bg-slate-950 flex overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-da-blue-900 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              {profile.display_name?.charAt(0) || "A"}
            </div>
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">{profile.display_name}</div>
              <div className="text-xs text-slate-500">Platform Admin</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="アカウント設定"
            >
              <SettingsIcon className="w-5 h-5" />
            </Link>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
